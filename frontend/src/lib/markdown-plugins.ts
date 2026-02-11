import { visit } from 'unist-util-visit';

// Plugin to remove inline code (backticks) from headings
export function remarkCleanHeadings() {
    return (tree: any) => {
        visit(tree, 'heading', (node) => {
            // Check if heading has children
            if (node.children && node.children.length > 0) {
                // Transform inlineCode nodes to text nodes
                node.children = node.children.map((child: any) => {
                    if (child.type === 'inlineCode') {
                        return { type: 'text', value: child.value };
                    }
                    return child;
                });
            }
        });
    };
}

// Plugin to transform specific list items into Description + CodeBlock
export function remarkSmartLists() {
    return (tree: any) => {
        visit(tree, 'listItem', (node) => {
            // Only process list items that have paragraph content
            if (!node.children || node.children.length === 0 || node.children[0].type !== 'paragraph') {
                return;
            }

            const paragraph = node.children[0];
            const content = paragraph.children;

            // Pattern 1: Code First (e.g. `file.yml` - Description)
            // Check if 1st is code, and 2nd is text starting with punctuation/separator
            if (
                content.length >= 2 &&
                content[0].type === 'inlineCode' &&
                content[1].type === 'text' &&
                /^\s*[:-]\s/.test(content[1].value) // Explicitly check for separator start
            ) {
                const codeValue = content[0].value;
                const descriptionText = content[1].value.replace(/^\s*[:-]\s+/, '').trim();

                node.children = [
                    {
                        type: 'paragraph',
                        children: [{ type: 'text', value: descriptionText }]
                    },
                    {
                        type: 'code',
                        lang: codeValue.endsWith('.list') ? 'list' : 'bash',
                        value: codeValue
                    }
                ];
                return;
            }

            // Pattern 2/3: Description First OR Code Middle/End
            // Heuristic: Find the LAST inlineCode node. Treat everything else as Description.
            // Move Description to the front, Code to the end.

            let codeIndex = -1;
            for (let i = content.length - 1; i >= 0; i--) {
                if (content[i].type === 'inlineCode') {
                    codeIndex = i;
                    break;
                }
            }

            if (codeIndex !== -1) {
                const codeNode = content[codeIndex];
                const codeValue = codeNode.value;

                // Collect everything except the code node as description
                const beforeNodes = content.slice(0, codeIndex);
                const afterNodes = content.slice(codeIndex + 1);

                let descriptionNodes = [...beforeNodes, ...afterNodes];

                // If there were nodes AFTER, we assume they are part of the description now.
                // We might need to ensure spacing. 
                // E.g. "Logs:" + [Code] + "on NetBox" -> "Logs: on NetBox" [Code]

                // Clean up trailing punctuation of the *entire* description sequence
                if (descriptionNodes.length > 0) {
                    const lastDesc = descriptionNodes[descriptionNodes.length - 1];
                    if (lastDesc.type === 'text') {
                        lastDesc.value = lastDesc.value.replace(/[:-\s]+$/, '').trim();
                    }
                }

                node.children = [
                    {
                        type: 'paragraph',
                        children: descriptionNodes
                    },
                    {
                        type: 'code',
                        lang: codeValue.endsWith('.list') ? 'list' : 'bash',
                        value: codeValue
                    }
                ];
            }
        });
    };
}

// Plugin to clean up trailing punctuation in paragraphs ending with code
export function remarkCleanParagraphs() {
    return (tree: any) => {
        visit(tree, 'paragraph', (node) => {
            if (!node.children || node.children.length === 0) return;

            const content = node.children;
            const hasLetters = (text: string) => /[a-zA-Z]/.test(text);

            // Find the last inlineCode node that is followed only by non-letters
            let codeIndex = -1;
            for (let i = content.length - 1; i >= 0; i--) {
                if (content[i].type === 'inlineCode') {
                    // Check if everything after it is just punctuation/whitespace/non-letters
                    const subsequentNodes = content.slice(i + 1);
                    const isEnd = subsequentNodes.every((n: any) =>
                        n.type !== 'text' || !hasLetters(n.value)
                    );

                    if (isEnd) {
                        codeIndex = i;
                        break;
                    }
                }
            }

            if (codeIndex !== -1) {
                // Keep everything up to the code node.
                // Discard the trailing "garbage" nodes.
                node.children = content.slice(0, codeIndex + 1);
            }
        });
    };
}

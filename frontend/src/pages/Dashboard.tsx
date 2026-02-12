import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSlug from 'rehype-slug';
import { remarkCleanHeadings, remarkSmartLists, remarkCleanParagraphs } from '../lib/markdown-plugins';
import { api } from '../lib/api';
import { FileText, Loader2, AlertCircle, ChevronRight, List } from 'lucide-react';
import 'highlight.js/styles/nord.css';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import makefile from 'highlight.js/lib/languages/makefile';
import json from 'highlight.js/lib/languages/json';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import go from 'highlight.js/lib/languages/go';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
});

// Mermaid Component
const Mermaid = ({ chart }: { chart: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState('');

    useEffect(() => {
        if (chart && ref.current) {
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            mermaid.render(id, chart).then(({ svg }) => {
                setSvg(svg);
            }).catch((error) => {
                console.error("Mermaid error:", error);
                setSvg(`<div class="text-red-500">Failed to render diagram</div>`);
            });
        }
    }, [chart]);

    return <div ref={ref} className="mermaid flex justify-center p-4 bg-white/5 rounded-lg overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
};

// Register languages
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('makefile', makefile);
hljs.registerLanguage('json', json);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('go', go);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('list', bash); // Register list as bash for path highlighting

// Custom Bash Language Definition
const customBash = (hljs: any) => {
    const base = bash(hljs);

    // Rule for prompt-based commands: $ command
    const promptRule = {
        begin: /^\s*[\$#]\s+/,
        className: 'meta.prompt',
        contains: [
            {
                className: 'built_in', // Highlight strictly the command word
                begin: /[\w\.-]+/,
                endsParent: true // Immediately exit to avoid highlighting args
            }
        ]
    };

    // Rule for implicit commands at start of line: command arg
    const implicitCommandRule = {
        className: 'built_in',
        begin: /^\s*[\w\.-]+/,
        end: /\s/, // Stop at first whitespace
        excludeEnd: true
    };

    // Add generic rules to the top
    if (base.contains) {
        base.contains.unshift(promptRule);
        base.contains.unshift(implicitCommandRule);
    }

    return base;
};
hljs.registerLanguage('bash', customBash);

// Helper for finding valid language
const getValidLanguage = (lang: string | null) => {
    if (!lang) return 'bash';
    if (lang === 'mermaid') return 'mermaid';
    return hljs.getLanguage(lang) ? lang : 'bash';
};

export default function Dashboard() {
    const { "*": path } = useParams();

    // Fetch repos first so we can resolve names to IDs
    const { data: repos, isLoading: isReposLoading } = useQuery({
        queryKey: ['repos'],
        queryFn: api.fetchRepos
    });

    // Resolve path (Name -> UUID)
    const resolvedPath = useMemo(() => {
        if (!path || !repos) return null;

        const parts = path.split('/');
        const firstSegment = parts[0];

        // Check if first segment is a UUID (check if it exists in repo IDs)
        const repoById = repos.find(r => r.id === firstSegment);
        if (repoById) return path;

        // Try to find by name
        const decodedName = decodeURIComponent(firstSegment);
        const repoByName = repos.find(r => r.name === decodedName);

        if (repoByName) {
            return [repoByName.id, ...parts.slice(1)].join('/');
        }

        return path;
    }, [path, repos]);

    // Fetch content using the resolved path
    const { data: content, isLoading: isContentLoading, isError: isContentError } = useQuery({
        queryKey: ['content', resolvedPath],
        queryFn: () => api.fetchContent(resolvedPath || ''),
        enabled: !!resolvedPath,
    });

    // Resolve Breadcrumbs
    const breadcrumbParts = useMemo(() => {
        if (!path) return [];
        const parts = path.split('/');
        // If it's a UUID, try to verify if we can replace it.
        // If it's a name (slug URL), we just use it.
        const firstSegment = parts[0];

        // If ID, map to Name
        if (repos) {
            const repo = repos.find(r => r.id === firstSegment);
            if (repo) {
                return [
                    { name: repo.name, path: null },
                    ...parts.slice(1).map(p => ({ name: p, path: null }))
                ];
            }
        }

        // Already a name or unknown ID
        return parts.map(p => ({ name: decodeURIComponent(p), path: null }));
    }, [path, repos]);

    // Extract Table of Contents
    const toc = useMemo(() => {
        if (!content) return [];
        const lines = content.split('\n');
        const headers = [];
        const headerRegex = /^(#{1,4})\s+(.+)$/;
        let inCodeBlock = false;

        for (const line of lines) {
            // Check for code block toggle (start or end)
            // We look for lines starting with ``` 
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }

            // Skip if inside code block
            if (inCodeBlock) continue;

            const match = line.match(headerRegex);
            if (match) {
                const level = match[1].length;
                let text = match[2];
                if (text.endsWith(':')) text = text.slice(0, -1);
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                headers.push({ level, text, id });
            }
        }
        return headers;
    }, [content]);

    const scrollToHeader = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (isReposLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!path) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                <FileText size={48} className="mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">No file selected</h2>
                <p>Select a document from the sidebar to view its content.</p>
            </div>
        );
    }

    if (isContentLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (isContentError) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-red-400">
                <AlertCircle size={48} className="mb-4 opacity-80" />
                <h2 className="text-xl font-semibold mb-2">Error loading file</h2>
                <p>Could not load content for {path}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-hidden flex flex-col h-full bg-background-dark">
            {/* Breadcrumb / Header */}
            <div className="shrink-0 bg-background-dark border-b border-white/10 px-6 py-4 flex items-center text-sm text-gray-400 shadow-sm z-10">
                <Link to="/" className="hover:text-primary transition-colors font-medium">Dashboard</Link>
                {breadcrumbParts.map((part, i) => (
                    <React.Fragment key={i}>
                        <ChevronRight size={14} className="mx-2 opacity-50" />
                        <span className={`truncate max-w-[200px] ${i === breadcrumbParts.length - 1 ? 'text-gray-200 font-medium' : ''}`}>
                            {part.name}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto flex">
                <div className="flex-1 min-w-0 w-full overflow-x-hidden">
                    <div className="max-w-4xl mx-auto p-8 md:p-12">
                        <article className="prose prose-invert prose-zinc max-w-none 
                            prose-headings:text-gray-100 prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl 
                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                            prose-pre:bg-[#2e3440] prose-pre:border prose-pre:border-white/10 prose-pre:shadow-lg
                            prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-primary/90 prose-code:before:content-none prose-code:after:content-none
                            prose-strong:text-white prose-blockquote:border-l-primary prose-blockquote:bg-white/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                        ">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks, remarkCleanHeadings, remarkSmartLists, remarkCleanParagraphs]}
                                rehypePlugins={[rehypeSlug]}
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const language = match ? match[1] : null;

                                        if (!inline && language === 'mermaid') {
                                            return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                        }

                                        if (!inline) {
                                            try {
                                                const validLanguage = getValidLanguage(language);

                                                if (validLanguage === 'mermaid') {
                                                    return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                                }

                                                const highlighted = hljs.highlight(String(children).replace(/\n$/, ''), { language: validLanguage }).value;
                                                return (
                                                    <pre className={className || 'language-bash'}>
                                                        <code
                                                            className={className || 'language-bash'}
                                                            dangerouslySetInnerHTML={{ __html: highlighted }}
                                                            {...props}
                                                        />
                                                    </pre>
                                                );
                                            } catch (e) {
                                                console.warn("Highlight error:", e);
                                            }
                                        }

                                        return (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {content || ''}
                            </ReactMarkdown>
                        </article>
                    </div>
                </div>

                {/* Table of Contents Sidebar */}
                {toc.length > 0 && (
                    <div className="hidden xl:block w-64 shrink-0 border-l border-white/5 bg-sidebar-dark/30 p-6 overflow-y-auto">
                        <div className="sticky top-0">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                                <List size={14} className="mr-2" />
                                On this page
                            </h3>
                            <ul className="space-y-2.5 text-sm">
                                {toc.map((item, i) => (
                                    <li key={i} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
                                        <button
                                            onClick={() => scrollToHeader(item.id)}
                                            className="text-left text-gray-400 hover:text-primary transition-colors line-clamp-2 block w-full"
                                        >
                                            {item.text}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

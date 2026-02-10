import os
from typing import Any

from app.config import settings


class FileService:
    def __init__(self, storage_path: str):
        self.storage_path = storage_path

    def get_tree(self, repos: list = None) -> list[dict[str, Any]]:
        tree = []
        if not repos:
             # Fallback to old behavior if no repos provided (though we should always provide them now)
             if not os.path.exists(self.storage_path):
                 return []
             return self._build_tree(self.storage_path)

        for repo in repos:
            # We only show ready repositories (or at least ones that exist)
            if not os.path.exists(repo.local_path):
                continue
            
            children = self._build_tree(repo.local_path)
            # Only add the repo to the tree if it has content (or if we want to show empty repos? User said "shouldnt show folders... unless they have markdown docs")
            # But the repo itself is a folder. If it's empty, maybe we show it as "Empty"?
            # User said "it does successfully add the public repo but the actual doc looks unformatted" -> unrelated.
            # "it shouldnt show the folders in the side bar unless they have markdown docs in them" -> applies to subfolders.
            # Implies repo root should probably be shown if it exists, or maybe hidden if truly empty?
            # Let's keep repo root but filter children.
            
            tree.append({
                "name": repo.name, # Use display name
                "type": "directory",
                "path": repo.id, # The ID is the path relative to storage root
                "children": children
            })
        
        return tree

    def _build_tree(self, path: str) -> list[dict[str, Any]]:
        nodes = []
        try:
            with os.scandir(path) as it:
                for entry in it:
                    if entry.name.startswith('.') or entry.name == 'config.json':
                        continue
                    
                    if entry.is_dir():
                        children = self._build_tree(entry.path)
                        # Filter: Only add directory if it has children (which means it has MD files deep down)
                        if children:
                            nodes.append({
                                "name": entry.name,
                                "type": "directory",
                                "path": entry.path.replace(self.storage_path, "", 1).lstrip("/"),
                                "children": children
                            })
                    elif entry.is_file() and entry.name.endswith('.md'):
                         nodes.append({
                            "name": entry.name,
                            "type": "file",
                            "path": entry.path.replace(self.storage_path, "", 1).lstrip("/")
                        })
        except OSError as e:
            print(f"Error scanning {path}: {e}")
        
        # Sort directories first, then files
        nodes.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))
        return nodes

    def get_content(self, relative_path: str) -> str:
        # Prevent traversal attacks
        full_path = os.path.abspath(os.path.join(self.storage_path, relative_path))
        if not full_path.startswith(os.path.abspath(self.storage_path)):
            raise ValueError("Invalid path")
        
        if not os.path.exists(full_path):
            raise FileNotFoundError("File not found")
            
        with open(full_path, encoding='utf-8') as f:
            return f.read()

    def search(self, query: str) -> list[dict[str, Any]]:
        results = []
        query = query.lower()
        for root, dirs, files in os.walk(self.storage_path):
            # Skip hidden folders
            if '/.' in root: 
                continue
                
            for file in files:
                if file.endswith('.md'):
                    full_path = os.path.join(root, file)
                    try:
                        with open(full_path, encoding='utf-8') as f:
                            content = f.read()
                            if query in content.lower() or query in file.lower():
                                rel_path = full_path.replace(self.storage_path, "", 1).lstrip("/")
                                # Basic snippet extraction could go here
                                results.append({
                                    "path": rel_path,
                                    "name": file,
                                    "match": "content" if query in content.lower() else "filename"
                                })
                    except Exception:
                        continue
        return results

file_service = FileService(settings.repo_storage_path)

def get_file_service():
    return file_service

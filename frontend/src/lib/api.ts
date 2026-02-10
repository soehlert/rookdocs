
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Repository {
    id: string;
    name: string;
    url: string;
    local_path: string;
    status: 'pending' | 'syncing' | 'ready' | 'error';
}

export interface TreeItem {
    name: string;
    type: 'file' | 'directory';
    path: string;
    children?: TreeItem[];
}

export interface SearchResult {
    path: string;
    name: string;
    match: string;
}

export const api = {
    fetchRepos: async (): Promise<Repository[]> => {
        const res = await fetch(`${API_URL}/repos/`);
        if (!res.ok) throw new Error('Failed to fetch repos');
        return res.json();
    },

    addRepo: async (name: string, url: string): Promise<Repository> => {
        const res = await fetch(`${API_URL}/repos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url }),
        });
        if (!res.ok) throw new Error('Failed to add repo');
        return res.json();
    },

    deleteRepo: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/repos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete repo');
    },

    syncRepo: async (id: string): Promise<Repository> => {
        const res = await fetch(`${API_URL}/repos/${id}/sync`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to sync repo');
        return res.json();
    },

    fetchTree: async (): Promise<TreeItem[]> => {
        const res = await fetch(`${API_URL}/content/tree`);
        if (!res.ok) throw new Error('Failed to fetch tree');
        return res.json();
    },

    fetchContent: async (path: string): Promise<string> => {
        const res = await fetch(`${API_URL}/content/content?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error('Failed to fetch content');
        const data = await res.json();
        return data.content;
    },

    search: async (query: string): Promise<SearchResult[]> => {
        if (query.length < 3) return [];
        const res = await fetch(`${API_URL}/content/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Failed to search');
        return res.json();
    }
};

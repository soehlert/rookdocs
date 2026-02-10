import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Trash2, RefreshCw, Plus, Folder, AlertTriangle, X, Pin } from 'lucide-react';

export default function Settings() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [newRepoName, setNewRepoName] = useState('');
    const [newRepoUrl, setNewRepoUrl] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [username, setUsername] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');

    // Force re-render on storage change
    const [pinnedRepoIds, setPinnedRepoIds] = useState<string[]>(() => {
        return JSON.parse(localStorage.getItem('pinnedRepos') || '[]');
    });

    const { data: repos, isLoading } = useQuery({
        queryKey: ['repos'],
        queryFn: api.fetchRepos
    });

    const addMutation = useMutation({
        mutationFn: (data: { name: string; url: string }) => api.addRepo(data.name, data.url),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repos'] });
            queryClient.invalidateQueries({ queryKey: ['tree'] });
            setNewRepoName('');
            setNewRepoUrl('');
            setIsPrivate(false);
            setUsername('');
            setToken('');
            setError('');
        },
        onError: (err: Error) => {
            console.error("Add repo error:", err);
            if (err.message.includes("128") || err.message.includes("Authentication")) {
                setError('Failed to access repository. Please check your credentials or token permissions.');
            } else {
                setError('Failed to add repository. Please check the URL and try again.');
            }
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteRepo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repos'] });
            queryClient.invalidateQueries({ queryKey: ['tree'] });
        }
    });

    const syncMutation = useMutation({
        mutationFn: api.syncRepo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repos'] });
            queryClient.invalidateQueries({ queryKey: ['tree'] });
        }
    });

    const togglePin = (repoId: string) => {
        const pinned = JSON.parse(localStorage.getItem('pinnedRepos') || '[]');
        let newPinned;
        if (pinned.includes(repoId)) {
            newPinned = pinned.filter((id: string) => id !== repoId);
        } else {
            newPinned = [...pinned, repoId];
        }
        localStorage.setItem('pinnedRepos', JSON.stringify(newPinned));
        setPinnedRepoIds(newPinned);
        window.dispatchEvent(new Event('storage')); // Notify Sidebar
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRepoName || !newRepoUrl) return;

        let finalUrl = newRepoUrl.trim();

        if (isPrivate) {
            if (!username || !token) {
                setError("Username and Token are required for private repositories.");
                return;
            }
            // Strip existing protocol if present
            let cleanUrl = finalUrl.replace(/^https?:\/\//, '');

            // Construct auth URL: https://user:token@host/path
            finalUrl = `https://${encodeURIComponent(username)}:${encodeURIComponent(token)}@${cleanUrl}`;
        }

        addMutation.mutate({ name: newRepoName, url: finalUrl });
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center min-h-full">
            <div className="w-full max-w-2xl bg-sidebar-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div>
                        <h1 className="text-xl font-semibold text-white">Repositories</h1>
                        <p className="text-sm text-gray-400 mt-1">Add or sync your repo documentation.</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Add Repo Form */}
                    <div className="mb-8">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Connect New</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 ml-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={newRepoName}
                                        onChange={(e) => setNewRepoName(e.target.value)}
                                        placeholder="e.g. Project Specs"
                                        className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder-gray-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 ml-1">Repository Path/URL</label>
                                    <input
                                        type="text"
                                        value={newRepoUrl}
                                        onChange={(e) => setNewRepoUrl(e.target.value)}
                                        placeholder="github.com/user/repo"
                                        className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder-gray-600 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="isPrivate"
                                        checked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-offset-background-dark"
                                    />
                                    <label htmlFor="isPrivate" className="text-sm text-gray-300 select-none cursor-pointer">
                                        This is a private repository
                                    </label>
                                </div>

                                <div className="border-l-2 border-white/5 pl-3 ml-1">
                                    <details className="group">
                                        <summary className="flex items-center text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors select-none list-none outline-none">
                                            <span className="mr-2 transition-transform duration-200 group-open:rotate-90">▶</span>
                                            How to add private repositories?
                                        </summary>
                                        <div className="mt-2 text-sm text-gray-400 space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <p>
                                                Use a <strong>Fine-grained Personal Access Token</strong> (PAT) for best security.
                                            </p>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-300">Required Permissions:</p>
                                                <ul className="list-disc list-inside text-xs text-gray-500 space-y-0.5 ml-1">
                                                    <li><code className="text-gray-300">Contents</code>: Read-only</li>
                                                    <li><code className="text-gray-300">Metadata</code>: Read-only</li>
                                                </ul>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Check "This is a private repository" above and enter your username and PAT. The authenticated URL will be constructed automatically.
                                            </p>
                                        </div>
                                    </details>
                                </div>
                            </div>

                            {isPrivate && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg border border-white/5 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-400 ml-1">GitHub Username</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="username"
                                            className="w-full bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-400 ml-1">Personal Access Token (PAT)</label>
                                        <input
                                            type="password"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            placeholder="github_pat_..."
                                            className="w-full bg-background-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            )}


                            {error && (
                                <div className="text-red-400 text-xs flex items-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    <AlertTriangle size={14} className="mr-2 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={addMutation.isPending || !newRepoName || !newRepoUrl}
                                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center shadow-lg shadow-primary/10 text-sm"
                            >
                                {addMutation.isPending ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
                                Add Repository
                            </button>
                        </form>
                    </div>

                    {/* List Repos */}
                    <div>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Connected Repositories</h2>
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="text-center py-4 text-gray-500 text-sm">Loading repositories...</div>
                            ) : repos && repos.length > 0 ? (
                                repos.map((repo: any) => (
                                    <div key={repo.id} className="bg-background-dark border border-white/5 rounded-lg p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                                        <div className="flex items-center min-w-0 gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                                <Folder size={20} className="text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-medium text-gray-200 truncate">{repo.name}</h3>
                                                <p className="text-xs text-gray-500 font-mono truncate max-w-xs">{repo.url}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="mr-2">
                                                {repo.status === 'ready' && <span className="text-xs text-green-400 font-medium px-2 py-0.5 bg-green-400/10 rounded">Ready</span>}
                                                {repo.status === 'syncing' && <span className="flex items-center text-xs text-blue-400 font-medium px-2 py-0.5 bg-blue-400/10 rounded"><RefreshCw size={10} className="animate-spin mr-1" /> Syncing</span>}
                                                {repo.status === 'error' && <span className="text-xs text-red-400 font-medium px-2 py-0.5 bg-red-400/10 rounded">Error</span>}
                                                {repo.status === 'pending' && <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-500/10 rounded">Pending</span>}
                                            </div>

                                            <button
                                                onClick={() => togglePin(repo.id)}
                                                className={`p-2 rounded-md transition-colors ${pinnedRepoIds.includes(repo.id) ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                                                title={pinnedRepoIds.includes(repo.id) ? "Unpin Repository" : "Pin Repository"}
                                            >
                                                <Pin size={16} fill={pinnedRepoIds.includes(repo.id) ? "currentColor" : "none"} />
                                            </button>

                                            <button
                                                onClick={() => syncMutation.mutate(repo.id)}
                                                disabled={syncMutation.isPending || repo.status === 'syncing'}
                                                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                                title="Sync Now"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteMutation.mutate(repo.id)}
                                                disabled={deleteMutation.isPending}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-md transition-colors"
                                                title="Remove Repository"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 border border-white/5 border-dashed rounded-lg bg-background-dark/50">
                                    <p className="text-gray-500 text-sm">No repositories connected.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end">
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

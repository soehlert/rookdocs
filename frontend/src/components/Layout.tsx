import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Settings, Search, Menu, X, ChevronRight, ChevronDown, FolderGit2, Pin } from 'lucide-react';
import { api } from '../lib/api';

export default function Layout() {
    const { pathname } = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedRepos, setExpandedRepos] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [pinnedRepoIds, setPinnedRepoIds] = useState<string[]>([]);

    const { data: tree } = useQuery({
        queryKey: ['repos'],
        queryFn: api.fetchRepos
    });

    // Load pinned repos on mount and listen for updates
    useEffect(() => {
        const loadPinned = () => {
            const pinned = JSON.parse(localStorage.getItem('pinnedRepos') || '[]');
            setPinnedRepoIds(pinned);
        };
        loadPinned();

        const handleStorageChange = () => loadPinned();
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const toggleRepo = (repoId: string) => {
        setExpandedRepos(prev =>
            prev.includes(repoId) ? prev.filter(id => id !== repoId) : [...prev, repoId]
        );
    };

    // Filter Repos
    const pinnedRepos = tree?.filter((repo: any) => pinnedRepoIds.includes(repo.id)) || [];
    const otherRepos = tree?.filter((repo: any) => !pinnedRepoIds.includes(repo.id)) || [];

    // Repo Item Component
    const RepoItem = ({ repo, isPinned = false }: { repo: any, isPinned?: boolean }) => {
        const isExpanded = expandedRepos.includes(repo.id);
        const encodedName = encodeURIComponent(repo.name);
        // Check if active: Check for ID OR Name matches in URL
        const isActive = pathname.includes(repo.id) || pathname.includes(encodedName);

        return (
            <div className="mb-1">
                <button
                    onClick={() => toggleRepo(repo.id)}
                    className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                >
                    <ChevronDown size={14} className={`mr-2 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                    {isPinned && <Pin size={12} className="mr-2 text-primary rotate-45" />}
                    <span className="truncate font-medium">{repo.name}</span>
                </button>

                {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-2">
                        {/* Use Name-based URL by default now */}
                        <Link
                            to={`/doc/${encodedName}/README.md`}
                            className={`block px-2 py-1 text-xs rounded-md transition-colors ${pathname.includes(`${encodedName}/README.md`) || pathname.includes(`${repo.id}/README.md`) ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            README.md
                        </Link>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-background-dark text-gray-100 font-sans selection:bg-primary/20">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} shrink-0 bg-sidebar-dark border-r border-white/5 transition-all duration-300 flex flex-col overflow-hidden`}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2 font-bold text-gray-100 tracking-tight">
                        <FolderGit2 className="text-primary" size={20} />
                        <span>RookDocs</span>
                    </div>
                </div>

                {/* Search Bar (Simplified Mock) */}
                <div className="p-4 border-b border-white/5 shrink-0 relative z-20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Pinned Repos */}
                    {pinnedRepos.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center">
                                <Pin size={12} className="mr-1" /> Pinned
                            </h3>
                            <div className="space-y-0.5">
                                {pinnedRepos.map((repo: any) => (
                                    <RepoItem key={`pinned-${repo.id}`} repo={repo} isPinned={true} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-2">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Repositories</h3>
                        <div className="space-y-0.5">
                            {otherRepos.map((repo: any) => (
                                <RepoItem key={repo.id} repo={repo} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 shrink-0">
                    <Link to="/settings" className="flex items-center px-2 py-2 text-sm text-gray-400 hover:text-gray-100 hover:bg-white/5 rounded-md transition-colors">
                        <Settings size={16} className="mr-2" />
                        Settings
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Settings, Search, ChevronDown, FolderGit2, Pin, FileText, Folder, Loader2, Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { api, type TreeItem, type SearchResult } from '../lib/api';

export default function Layout() {
    const { pathname } = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Change to false by default for mobile, logic handles desktop
    const [isMobile, setIsMobile] = useState(false);
    const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [pinnedRepoIds, setPinnedRepoIds] = useState<string[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data: repos } = useQuery({
        queryKey: ['repos'],
        queryFn: api.fetchRepos
    });

    const { data: tree } = useQuery({
        queryKey: ['tree'],
        queryFn: api.fetchTree
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounce(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search Query
    const { data: searchResults, isLoading: isSearchLoading } = useQuery({
        queryKey: ['search', searchDebounce],
        queryFn: () => api.search(searchDebounce),
        enabled: searchDebounce.length > 2,
    });

    // Track mobile state
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768; // md breakpoint
            if (mobile !== isMobile) {
                setIsMobile(mobile);
                if (mobile) {
                    setIsSidebarOpen(false); // Default to closed on mobile transition
                } else {
                    setIsSidebarOpen(true); // Default to open on desktop transition
                }
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [isMobile]);

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

    // Command+K Shortcut & Escape to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setSearchQuery('');
                searchInputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const togglePath = (path: string) => {
        setExpandedPaths(prev =>
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
    };

    // Helper to get Repo Name from ID (first path segment)
    const getRepoName = (id: string) => {
        return repos?.find((r: any) => r.id === id)?.name || id;
    };

    // Helper to clear search
    const handleResultClick = () => {
        setSearchQuery('');
    };

    const closeSidebarIfMobile = () => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    // Recursive File Tree Component
    const FileTreeItem = ({ item, level = 0, repoNameForUrl }: { item: TreeItem, level?: number, repoNameForUrl?: string }) => {
        const isExpanded = expandedPaths.includes(item.path);

        const pathParts = item.path.split('/');
        const repoId = pathParts[0];
        const effectiveRepoName = repoNameForUrl || getRepoName(repoId);

        const relativePath = pathParts.slice(1).join('/');
        const urlPath = relativePath ? `${encodeURIComponent(effectiveRepoName)}/${relativePath}` : encodeURIComponent(effectiveRepoName);

        const isActive = pathname.includes(urlPath) || pathname.includes(item.path);
        const isDir = item.type === 'directory';

        return (
            <div className="select-none">
                {isDir ? (
                    <div>
                        <button
                            onClick={() => togglePath(item.path)}
                            className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                            style={{ paddingLeft: `${(level * 12) + 8}px` }}
                        >
                            <ChevronDown size={14} className={`mr-2 transition-transform shrink-0 ${isExpanded ? '' : '-rotate-90'}`} />
                            <span className="truncate font-medium">{level === 0 ? effectiveRepoName : item.name}</span>
                        </button>
                        {isExpanded && item.children && (
                            <div className="mt-1">
                                {item.children.map((child: any) => (
                                    <FileTreeItem key={child.path} item={child} level={level + 1} repoNameForUrl={effectiveRepoName} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        to={`/doc/${urlPath}`}
                        onClick={closeSidebarIfMobile}
                        className={`flex items-center px-2 py-1.5 text-xs rounded-md transition-colors ${isActive ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        style={{ paddingLeft: `${(level * 12) + 24}px` }}
                    >
                        <FileText size={12} className="mr-2 shrink-0 opacity-70" />
                        <span className="truncate">{item.name}</span>
                    </Link>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-background-dark text-gray-100 font-sans selection:bg-primary/20 overflow-hidden">
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden fixed top-4 right-4 z-[60] p-2 bg-sidebar-dark border border-white/10 rounded-lg shadow-lg text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle Menu"
            >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Backdrop */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${isMobile ? 'fixed inset-y-0 left-0 z-50 transition-transform duration-300 transform shadow-2xl' : 'relative transition-all duration-300'}
                ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                ${!isMobile && !isSidebarOpen ? 'w-0' : 'w-64'}
                shrink-0 bg-sidebar-dark border-r border-white/5 flex flex-col overflow-hidden
            `}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                    <Link
                        to="/"
                        onClick={() => setSearchQuery('')}
                        className="flex items-center space-x-2 font-bold text-gray-100 tracking-tight hover:text-primary transition-colors overflow-hidden"
                    >
                        <FolderGit2 className="text-primary shrink-0" size={20} />
                        <span className="truncate">RookDocs</span>
                    </Link>
                    {!isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            title="Collapse sidebar"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-white/5 shrink-0 relative z-20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search docs (Cmd+K)..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {/* Search Results Dropdown */}
                        {searchQuery.length > 2 && (
                            <div className="absolute top-full left-4 right-4 mt-2 bg-sidebar-dark border border-white/10 rounded-lg shadow-2xl max-h-64 overflow-y-auto z-50">
                                {isSearchLoading ? (
                                    <div className="p-4 text-center text-gray-400 flex items-center justify-center">
                                        <Loader2 size={16} className="animate-spin mr-2" /> Searching...
                                    </div>
                                ) : searchResults && searchResults.length > 0 ? (
                                    <ul>
                                        {searchResults.map((result: SearchResult, idx: number) => {
                                            // Resolve path for search result
                                            const pathParts = result.path.split('/');
                                            const repoId = pathParts[0];
                                            const repoName = getRepoName(repoId);
                                            const urlPath = `${encodeURIComponent(repoName)}/${pathParts.slice(1).join('/')}`;

                                            return (
                                                <li key={idx} className="border-b border-white/5 last:border-0">
                                                    <Link
                                                        to={`/doc/${urlPath}`}
                                                        onClick={() => { handleResultClick(); closeSidebarIfMobile(); }}
                                                        className="block p-3 hover:bg-white/5 transition-colors group"
                                                    >
                                                        <div className="flex items-center text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1 group-hover:text-gray-400 transition-colors">
                                                            <FolderGit2 size={10} className="mr-1.5" />
                                                            {repoName}
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-200 truncate pl-4 border-l border-white/10 group-hover:border-primary/50 transition-colors">
                                                            {pathParts.slice(1).join('/') || result.name}
                                                        </div>
                                                        {result.match && (
                                                            <div className="text-xs text-gray-500 mt-1.5 ml-4 pl-2 border-l border-transparent group-hover:border-white/10 line-clamp-2 font-mono bg-black/20 p-1 rounded" dangerouslySetInnerHTML={{ __html: result.match }} />
                                                        )}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-sm">No results found.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Pinned Repos */}
                    {pinnedRepoIds.length > 0 && repos && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center">
                                <Pin size={12} className="mr-1" /> Pinned
                            </h3>
                            <div className="space-y-0.5">
                                {pinnedRepoIds.map((id: string) => {
                                    const repo = repos.find((r: any) => r.id === id);
                                    // Try to find tree item
                                    const treeItem = tree?.find((t: any) => t.path === id);

                                    if (treeItem && repo) {
                                        return <FileTreeItem key={`pinned-${id}`} item={treeItem} repoNameForUrl={repo.name} />;
                                    }

                                    // Fallback
                                    return repo ? (
                                        <Link
                                            key={`pinned-${id}`}
                                            to={`/doc/${encodeURIComponent(repo.name)}/README.md`}
                                            className="block px-2 py-1.5 text-sm text-gray-400 hover:text-white"
                                        >
                                            {repo.name}
                                        </Link>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}

                    <div className="mb-2">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Repositories</h3>
                        <div className="space-y-0.5">
                            {tree && tree.length > 0 ? (
                                tree.map((item: TreeItem) => {
                                    const isPinned = pinnedRepoIds.includes(item.path);
                                    if (isPinned) return null; // Hide if pinned to deduplicate
                                    const repoName = getRepoName(item.path);
                                    return <FileTreeItem key={item.path} item={item} repoNameForUrl={repoName} />;
                                })
                            ) : (
                                // Fallback if tree is empty (server issue or loading) -> Show basic Repo List
                                repos?.map((repo: any) => {
                                    const isPinned = pinnedRepoIds.includes(repo.id);
                                    if (isPinned) return null;
                                    return (
                                        <Link
                                            key={repo.id}
                                            to={`/doc/${encodeURIComponent(repo.name)}/README.md`}
                                            onClick={closeSidebarIfMobile}
                                            className="block px-2 py-1.5 text-sm text-gray-400 hover:text-white flex items-center"
                                        >
                                            <Folder className="mr-2 opacity-50" size={14} />
                                            {repo.name}
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 shrink-0">
                    <Link
                        to="/repositories"
                        onClick={() => { setSearchQuery(''); closeSidebarIfMobile(); }}
                        className="flex items-center px-2 py-2 text-sm text-gray-400 hover:text-gray-100 hover:bg-white/5 rounded-md transition-colors"
                    >
                        <Settings size={16} className="mr-2" />
                        Repositories
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 overflow-hidden relative ${isMobile ? 'pt-16' : ''}`}>
                {!isMobile && !isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed top-4 left-4 z-30 p-2 bg-sidebar-dark border border-white/10 rounded-lg shadow-lg text-gray-400 hover:text-white transition-colors"
                        title="Expand sidebar"
                    >
                        <PanelLeftOpen size={20} />
                    </button>
                )}
                <Outlet />
            </main>
        </div>
    );
}

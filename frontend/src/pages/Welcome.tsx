import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Cloud, FileText, Folder, BookOpen, ArrowRight, ChevronLeft, ChevronRight as ChevronRightIcon, ChessRook } from 'lucide-react';
import { api } from '../lib/api';

const ITEMS_PER_PAGE = 6; // Grid of 2x3 or 3x2 looks good

export default function Welcome() {
    const [page, setPage] = useState(1);
    const { data: repos } = useQuery({
        queryKey: ['repos'],
        queryFn: api.fetchRepos
    });

    const hasRepos = repos && repos.length > 0;

    // Pagination Logic
    // Pagination Logic. Repos reversed for Newest First.
    const sortedRepos = repos ? [...repos].reverse() : [];
    const totalPages = Math.ceil(sortedRepos.length / ITEMS_PER_PAGE);
    const paginatedRepos = sortedRepos.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const nextPage = () => setPage(p => Math.min(p + 1, totalPages));
    const prevPage = () => setPage(p => Math.max(p - 1, 1));

    return (
        <div className="h-full flex flex-col items-center justify-start md:justify-center p-8 pt-20 md:pt-8 text-center animate-in fade-in duration-1000 overflow-y-auto custom-scrollbar">
            {/* Illustration */}
            <div className="mb-8 relative w-32 h-32 md:w-48 md:h-48">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
                <div className="relative flex items-center justify-center h-full">
                    <div className={`absolute top-10 right-10 bg-background-dark/80 p-4 rounded-2xl border border-white/10 rotate-12 shadow-2xl backdrop-blur-sm transition-all duration-700 ${hasRepos ? 'translate-x-4' : ''}`}>
                        {hasRepos ? <BookOpen size={24} className="text-primary" /> : <Plus size={24} className="text-primary" />}
                    </div>
                    <div className="bg-gradient-to-br from-background-dark to-sidebar-dark p-6 rounded-3xl border border-white/10 shadow-2xl relative z-10">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-0">
                            <ChessRook size={24} className="text-primary" />
                        </div>
                    </div>
                    <div className={`absolute bottom-10 left-8 bg-background-dark/90 p-5 rounded-2xl border border-white/10 -rotate-6 shadow-xl backdrop-blur-sm z-0 transition-all duration-700 ${hasRepos ? '-translate-x-4' : ''}`}>
                        <FileText size={24} className="text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                {hasRepos ? 'Welcome back' : 'Your workspace is empty'}
            </h1>

            <p className="text-gray-400 text-lg max-w-lg mb-10 leading-relaxed">
                {hasRepos
                    ? 'Select a repository to start reading or manage your knowledge base.'
                    : 'Connect a local Markdown folder or link a remote Git repository to start organizing your knowledge with RookDocs.'}
            </p>

            {hasRepos ? (
                <div className="w-full max-w-4xl flex flex-col items-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                        {paginatedRepos.map((repo: any) => (
                            <Link
                                key={repo.id}
                                to={`/doc/${encodeURIComponent(repo.name)}/README.md`}
                                className="flex flex-col p-5 bg-sidebar-dark border border-white/5 hover:border-white/10 rounded-xl group transition-all hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl shadow-black/20"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Folder size={20} className="text-primary" />
                                    </div>
                                    <ArrowRight size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </div>
                                <div className="text-left min-w-0">
                                    <h3 className="font-medium text-gray-200 truncate text-lg mb-1">{repo.name}</h3>
                                    <p className="text-xs text-primary/90 font-mono bg-white/10 px-1.5 py-0.5 rounded inline-block truncate max-w-full">
                                        {repo.url.replace(/^https?:\/\/(.*@)?(www\.)?github\.com\//, '').replace(/\.git$/, '')}
                                    </p>
                                </div>
                            </Link>
                        ))}

                        {/* "Add New" Card acting as the last item if reasonable, or separate button */}
                        <Link
                            to="/repositories"
                            className="flex flex-col items-center justify-center p-5 border border-dashed border-white/10 hover:border-white/20 rounded-xl group transition-all hover:bg-white/5 min-h-[140px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus size={20} className="text-gray-400 group-hover:text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-400 group-hover:text-white">Add Repository</span>
                        </Link>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center space-x-4 mt-8">
                            <button
                                onClick={prevPage}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm text-gray-500 font-mono">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={nextPage}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronRightIcon size={20} />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link
                        to="/repositories"
                        className="flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={18} className="mr-2" />
                        Add New Repository
                    </Link>

                    <Link
                        to="/repositories"
                        className="flex items-center justify-center px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-200 rounded-lg font-medium border border-white/10 transition-all hover:border-white/20"
                    >
                        <Cloud size={18} className="mr-2 text-gray-400" />
                        Import from GitHub
                    </Link>
                </div>
            )}
        </div>
    );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Cloud, FileText, Folder, BookOpen, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export default function Welcome() {
    const { data: repos } = useQuery({
        queryKey: ['repos'],
        queryFn: api.fetchRepos
    });

    const hasRepos = repos && repos.length > 0;

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
            {/* Illustration */}
            <div className="mb-8 relative w-48 h-48 ml-4">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
                <div className="relative flex items-center justify-center h-full">
                    <div className={`absolute top-10 right-10 bg-background-dark/80 p-4 rounded-2xl border border-white/10 rotate-12 shadow-2xl backdrop-blur-sm transition-all duration-700 ${hasRepos ? 'translate-x-4' : ''}`}>
                        {hasRepos ? <BookOpen size={24} className="text-primary" /> : <Plus size={24} className="text-primary" />}
                    </div>
                    <div className="bg-gradient-to-br from-background-dark to-sidebar-dark p-6 rounded-3xl border border-white/10 shadow-2xl relative z-10">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-0">
                            <div className="w-6 h-6 border-2 border-primary rounded-md"></div>
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
                <div className="w-full max-w-md grid gap-3">
                    {repos.map((repo: any) => (
                        <Link
                            key={repo.id}
                            to={`/doc/${encodeURIComponent(repo.name)}/README.md`}
                            className="flex items-center p-4 bg-sidebar-dark border border-white/5 hover:border-white/10 rounded-xl group transition-all hover:bg-white/5"
                        >
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mr-4 group-hover:bg-primary/10 transition-colors">
                                <Folder size={20} className="text-primary" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h3 className="font-medium text-gray-200 truncate">{repo.name}</h3>
                                <p className="text-xs text-gray-500 truncate">{repo.url}</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Link>
                    ))}
                    <div className="mt-4 border-t border-white/5 pt-4">
                        <Link
                            to="/settings"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            <Plus size={14} className="mr-1.5" />
                            Add another repository
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link
                        to="/settings"
                        className="flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={18} className="mr-2" />
                        Add New Repository
                    </Link>

                    <Link
                        to="/settings"
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

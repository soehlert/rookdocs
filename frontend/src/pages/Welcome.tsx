import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Cloud, FileText } from 'lucide-react';

export default function Welcome() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
            {/* Illustration */}
            <div className="mb-8 relative w-48 h-48 ml-4">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
                <div className="relative flex items-center justify-center h-full">
                    <div className="absolute top-10 right-10 bg-background-dark/80 p-4 rounded-2xl border border-white/10 rotate-12 shadow-2xl backdrop-blur-sm">
                        <Plus size={24} className="text-primary" />
                    </div>
                    <div className="bg-gradient-to-br from-background-dark to-sidebar-dark p-6 rounded-3xl border border-white/10 shadow-2xl relative z-10">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-0">
                            <div className="w-6 h-6 border-2 border-primary rounded-md"></div>
                        </div>
                    </div>
                    <div className="absolute bottom-10 left-8 bg-background-dark/90 p-5 rounded-2xl border border-white/10 -rotate-6 shadow-xl backdrop-blur-sm z-0">
                        <FileText size={24} className="text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Your workspace is empty
            </h1>

            <p className="text-gray-400 text-lg max-w-lg mb-10 leading-relaxed">
                Connect a local Markdown folder or link a remote Git repository to start organizing your knowledge with RookDocs.
            </p>

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
        </div>
    );
}

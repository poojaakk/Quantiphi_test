import React from 'react';
import { Plus, UserPlus, FolderPlus, Database, CheckCircle, Server, Sparkles } from 'lucide-react';

export default function Navbar({
  dbStatus,
  onOpenTaskModal,
  onOpenUserModal,
  onOpenProjectModal,
  projectName
}) {
  const isNeon = dbStatus?.usingNeon;

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M3 3h7v18H3V3zm11 0h7v10h-7V3zm0 14h7v4h-7v-4z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                FlowBoard
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Kanban
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
              Team Productivity & Task Organization
            </p>
          </div>
        </div>

        {/* Database Status Badge */}
        <div className="hidden md:flex items-center">
          {isNeon ? (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              title="Connected to Neon Serverless PostgreSQL"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database className="w-3.5 h-3.5" />
              <span>Neon PostgreSQL Connected</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
              title="Running with zero-config memory store. Add Neon DATABASE_URL in server/.env anytime."
            >
              <Server className="w-3.5 h-3.5 text-indigo-500" />
              <span>Instant DB Active (Neon Ready)</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Add Project */}
          <button
            type="button"
            onClick={onOpenProjectModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Create new project"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          {/* Add User */}
          <button
            type="button"
            onClick={onOpenUserModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Add user to project"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Member</span>
          </button>

          {/* Create Task (Primary CTA) */}
          <button
            type="button"
            onClick={onOpenTaskModal}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>
    </header>
  );
}

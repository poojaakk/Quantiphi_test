import React from 'react';
import { Search, Filter, Folder, X } from 'lucide-react';

const PRIORITIES = [
  { id: 'ALL', label: 'All Priorities' },
  { id: 'URGENT', label: 'Urgent', color: 'bg-rose-500' },
  { id: 'HIGH', label: 'High', color: 'bg-amber-500' },
  { id: 'MEDIUM', label: 'Medium', color: 'bg-blue-500' },
  { id: 'LOW', label: 'Low', color: 'bg-slate-400' }
];

export default function FilterBar({
  projects = [],
  selectedProject,
  onSelectProject,
  selectedPriority,
  onSelectPriority,
  searchQuery,
  onSearchChange,
  totalTasks = 0
}) {
  const isFiltered = selectedPriority !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    onSelectPriority('ALL');
    onSearchChange('');
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4 mb-6 transition-all">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Project Selector & Search */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Project Dropdown */}
          <div className="relative min-w-[220px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Folder className="w-4 h-4 text-indigo-500" />
            </div>
            <select
              value={selectedProject || ''}
              onChange={(e) => onSelectProject(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name} ({p.task_count || 0} tasks)
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks by title or details..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Task counter & Clear button */}
        <div className="flex items-center gap-3 justify-end text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{totalTasks} visible tasks</span>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Priority Pill Filters */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Priority:</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {PRIORITIES.map((p) => {
            const isActive = selectedPriority === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPriority(p.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p.color && <span className={`w-1.5 h-1.5 rounded-full ${p.color}`} />}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

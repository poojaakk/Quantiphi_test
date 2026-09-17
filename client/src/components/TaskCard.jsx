import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, Trash2, Edit3, User, AlertCircle, Clock } from 'lucide-react';

const priorityConfig = {
  URGENT: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/60',
    indicator: 'bg-rose-500'
  },
  HIGH: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/60',
    indicator: 'bg-amber-500'
  },
  MEDIUM: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/60',
    indicator: 'bg-blue-500'
  },
  LOW: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    indicator: 'bg-slate-400'
  }
};

export default function TaskCard({ task, index, onEdit, onDelete }) {
  const priority = (task.priority || 'MEDIUM').toUpperCase();
  const badge = priorityConfig[priority] || priorityConfig.MEDIUM;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE';

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group relative rounded-xl border bg-white dark:bg-slate-900 p-4 transition-all duration-200 ${
            snapshot.isDragging
              ? 'shadow-2xl ring-2 ring-indigo-500/70 border-indigo-400 dark:border-indigo-500 scale-[1.02] z-50'
              : 'shadow-sm hover:shadow-md border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {/* Top Row: Priority Badge & Action Buttons */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.indicator}`}></span>
              {priority}
            </span>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit task"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-1.5">
            {task.title}
          </h4>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {task.description}
            </p>
          )}

          {/* Bottom Row: Due Date & Assignee */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Due Date */}
            {task.due_date ? (
              <div
                className={`inline-flex items-center gap-1 font-medium ${
                  isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                title={isOverdue ? 'Overdue!' : 'Due Date'}
              >
                {isOverdue ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{formatDueDate(task.due_date)}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-slate-300 dark:text-slate-600">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px]">No due date</span>
              </div>
            )}

            {/* Assignee Avatar */}
            {task.assignee_name ? (
              <div
                className="flex items-center gap-1.5"
                title={`Assigned to ${task.assignee_name} (${task.assignee_email || ''})`}
              >
                {task.assignee_avatar ? (
                  <img
                    src={task.assignee_avatar}
                    alt={task.assignee_name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                    {task.assignee_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 max-w-[85px] truncate">
                  {task.assignee_name.split(' ')[0]}
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Unassigned</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

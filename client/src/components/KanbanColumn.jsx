import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

export default function KanbanColumn({
  id,
  title,
  icon: Icon,
  badgeBg,
  badgeText,
  headerBorder,
  tasks = [],
  onEditTask,
  onDeleteTask,
  onAddTask
}) {
  return (
    <div className="flex flex-col flex-1 min-w-[300px] max-w-[420px] bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden backdrop-blur-sm">
      {/* Column Header */}
      <div className={`flex items-center justify-between px-4 py-3.5 border-b ${headerBorder} bg-white/60 dark:bg-slate-900/60`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {Icon && <Icon className="w-4 h-4" />}
          </div>
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 tracking-tight">
            {title}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badgeBg} ${badgeText}`}>
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddTask(id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          title={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Droppable Card Container */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[300px] transition-colors duration-150 ${
              snapshot.isDraggingOver
                ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}

            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">
                  No tasks in this column
                </p>
                <button
                  type="button"
                  onClick={() => onAddTask(id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add a task
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

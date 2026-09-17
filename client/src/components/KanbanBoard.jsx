import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';

const COLUMNS = [
  {
    id: 'TODO',
    title: 'To-Do',
    icon: Circle,
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    headerBorder: 'border-slate-200/80 dark:border-slate-800'
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    icon: Clock,
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    headerBorder: 'border-amber-200/50 dark:border-amber-900/40'
  },
  {
    id: 'DONE',
    title: 'Done',
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    headerBorder: 'border-emerald-200/50 dark:border-emerald-900/40'
  }
];

export default function KanbanBoard({
  tasks,
  onTaskMove,
  onEditTask,
  onDeleteTask,
  onAddTask
}) {
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Dropped in exact same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    onTaskMove({
      taskId: parseInt(draggableId, 10),
      sourceCol: source.droppableId,
      destCol: destination.droppableId,
      sourceIndex: source.index,
      destIndex: destination.index
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col md:flex-row gap-6 items-start overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const columnTasks = tasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => (a.position - b.position) || (a.id - b.id));

          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              icon={col.icon}
              badgeBg={col.badgeBg}
              badgeText={col.badgeText}
              headerBorder={col.headerBorder}
              tasks={columnTasks}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onAddTask={onAddTask}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import TaskModal from './components/TaskModal';
import AddUserModal from './components/AddUserModal';
import ProjectModal from './components/ProjectModal';
import * as api from './services/api';
import {
  CheckCircle2,
  Users,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [targetColumn, setTargetColumn] = useState('TODO');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Toast / Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [health, fetchedProjects, fetchedUsers] = await Promise.all([
        api.checkHealth().catch(() => ({ database: { connected: false } })),
        api.fetchProjects().catch(() => []),
        api.fetchUsers().catch(() => [])
      ]);

      setDbStatus(health.database);
      setProjects(fetchedProjects);
      setUsers(fetchedUsers);

      if (fetchedProjects.length > 0) {
        const initialProjId = fetchedProjects[0].id;
        setSelectedProjectId(initialProjId);
        await loadProjectDetails(initialProjId);
      }
    } catch (err) {
      showToast('Error loading application data', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (projId) => {
    try {
      const [fetchedTasks, fetchedMembers] = await Promise.all([
        api.fetchTasks({ projectId: projId }),
        api.fetchProjectMembers(projId).catch(() => [])
      ]);
      setTasks(fetchedTasks);
      setProjectMembers(fetchedMembers);
    } catch (err) {
      console.error('Error fetching project details:', err);
      showToast('Failed to refresh tasks', 'error');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When selected project changes
  const handleSelectProject = async (projId) => {
    setSelectedProjectId(projId);
    if (projId) {
      await loadProjectDetails(projId);
    }
  };

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Filter tasks locally by search & priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedPriority !== 'ALL' && task.priority?.toUpperCase() !== selectedPriority.toUpperCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = task.title?.toLowerCase().includes(query);
        const inDesc = task.description?.toLowerCase().includes(query);
        const inAssignee = task.assignee_name?.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inAssignee) return false;
      }
      return true;
    });
  }, [tasks, selectedPriority, searchQuery]);

  // Task Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'TODO').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, todo, inProgress, done, percent };
  }, [tasks]);

  // Drag and Drop Handler with Optimistic Updates
  const handleTaskMove = async ({ taskId, sourceCol, destCol, sourceIndex, destIndex }) => {
    const originalTasks = [...tasks];

    // Optimistic state update
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: destCol,
          position: destIndex
        };
      }
      return task;
    });

    setTasks(updatedTasks);

    try {
      await api.updateTaskStatus(taskId, destCol, destIndex);
      const colLabels = { TODO: 'To-Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
      showToast(`Task shifted to ${colLabels[destCol] || destCol}`);
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert on error
      setTasks(originalTasks);
      showToast('Could not save task position, reverted.', 'error');
    }
  };

  // Open task create modal
  const handleOpenCreateTask = (status = 'TODO') => {
    setEditingTask(null);
    setTargetColumn(status);
    setIsTaskModalOpen(true);
  };

  // Open task edit modal
  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Submit Task (Create or Update)
  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      const updated = await api.updateTask(editingTask.id, taskData);
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated } : t)));
      showToast('Task updated successfully');
    } else {
      const created = await api.createTask({
        ...taskData,
        project_id: selectedProjectId
      });
      setTasks((prev) => [...prev, created]);
      // Update task count on project
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProjectId ? { ...p, task_count: (p.task_count || 0) + 1 } : p))
      );
      showToast('New task created');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const original = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await api.deleteTask(taskId);
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProjectId ? { ...p, task_count: Math.max(0, (p.task_count || 1) - 1) } : p))
      );
      showToast('Task deleted');
    } catch (err) {
      setTasks(original);
      showToast('Failed to delete task', 'error');
    }
  };

  // Add Member to Project
  const handleAddMember = async (projectId, memberData) => {
    const res = await api.addProjectMember(projectId, memberData);
    setProjectMembers((prev) => [...prev, res]);
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, member_count: (p.member_count || 0) + 1 } : p))
    );
    showToast(`${res.name || 'Member'} added to project!`);
  };

  // Create User
  const handleCreateUser = async (userData) => {
    const newUser = await api.createUser(userData);
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  // Create Project
  const handleCreateProject = async (projectData) => {
    const newProj = await api.createProject(projectData);
    setProjects((prev) => [...prev, newProj]);
    setSelectedProjectId(newProj.id);
    setTasks([]);
    setProjectMembers([]);
    showToast(`Project "${newProj.name}" created!`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold border ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700 shadow-slate-900/30'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        dbStatus={dbStatus}
        onOpenTaskModal={() => handleOpenCreateTask('TODO')}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        projectName={activeProject?.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Project Header Banner & Stats */}
        {activeProject && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Project Title & Description */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    {activeProject.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <Layers className="w-3.5 h-3.5" />
                    Active Board
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {activeProject.description || 'Manage tasks, track delivery phases, and collaborate with your team.'}
                </p>

                {/* Team Members Chips */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Project Team ({projectMembers.length}):</span>
                  </div>
                  {projectMembers.map((m) => (
                    <div
                      key={m.membership_id || m.user_id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700"
                      title={`${m.email || ''} • ${m.role}`}
                    >
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={m.name} className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold flex items-center justify-center">
                          {m.name ? m.name.charAt(0) : 'U'}
                        </div>
                      )}
                      <span>{m.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                        ({m.role})
                      </span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    + Assign User
                  </button>
                </div>
              </div>

              {/* Progress & Stat Badges */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shrink-0">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-1.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      Completion
                    </span>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      {stats.percent}%
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-44 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                {/* Pill Stats */}
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="text-center">
                    <span className="block text-slate-400 dark:text-slate-500 text-[10px] uppercase">To-Do</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{stats.todo}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-amber-500 text-[10px] uppercase">In Prog</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-emerald-500 text-[10px] uppercase">Done</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.done}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <FilterBar
          projects={projects}
          selectedProject={selectedProjectId}
          onSelectProject={handleSelectProject}
          selectedPriority={selectedPriority}
          onSelectPriority={setSelectedPriority}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalTasks={filteredTasks.length}
        />

        {/* Kanban Board */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading board tasks and database state...
            </p>
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            onTaskMove={handleTaskMove}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onAddTask={handleOpenCreateTask}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        <p>FlowBoard • Full-stack Kanban App with PostgreSQL (Neon) & Node.js CRUD Engine</p>
      </footer>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        initialData={editingTask}
        initialStatus={targetColumn}
        projectId={selectedProjectId}
        users={users}
      />

      <AddUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        projectId={selectedProjectId}
        allUsers={users}
        currentMembers={projectMembers}
        onAddMember={handleAddMember}
        onCreateUser={handleCreateUser}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}

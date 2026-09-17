import express from 'express';
import { pool, memStore, getDBStatus } from '../db.js';

const router = express.Router();

// GET /api/tasks - Retrieve all tasks with optional filters
router.get('/', async (req, res) => {
  try {
    const { projectId, priority, search, assignedTo } = req.query;
    const status = getDBStatus();

    if (status.usingNeon && pool) {
      let query = `
        SELECT t.*, 
               u.name AS assignee_name, 
               u.avatar_url AS assignee_avatar, 
               u.email AS assignee_email,
               p.name AS project_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE 1=1
      `;
      const values = [];
      let idx = 1;

      if (projectId) {
        query += ` AND t.project_id = $${idx++}`;
        values.push(parseInt(projectId, 10));
      }

      if (priority && priority !== 'ALL') {
        query += ` AND t.priority = $${idx++}`;
        values.push(priority.toUpperCase());
      }

      if (assignedTo) {
        query += ` AND t.assigned_to = $${idx++}`;
        values.push(parseInt(assignedTo, 10));
      }

      if (search) {
        query += ` AND (t.title ILIKE $${idx} OR t.description ILIKE $${idx})`;
        values.push(`%${search}%`);
        idx++;
      }

      query += ` ORDER BY t.position ASC, t.id ASC`;

      const result = await pool.query(query, values);
      return res.json(result.rows);
    } else {
      // Memory store handler
      let tasks = [...memStore.tasks];

      if (projectId) {
        tasks = tasks.filter(t => t.project_id === parseInt(projectId, 10));
      }

      if (priority && priority !== 'ALL') {
        tasks = tasks.filter(t => t.priority.toUpperCase() === priority.toUpperCase());
      }

      if (assignedTo) {
        tasks = tasks.filter(t => t.assigned_to === parseInt(assignedTo, 10));
      }

      if (search) {
        const q = search.toLowerCase();
        tasks = tasks.filter(t => 
          (t.title && t.title.toLowerCase().includes(q)) || 
          (t.description && t.description.toLowerCase().includes(q))
        );
      }

      // Populate joined fields
      const enriched = tasks.map(t => {
        const user = memStore.users.find(u => u.id === t.assigned_to);
        const project = memStore.projects.find(p => p.id === t.project_id);
        return {
          ...t,
          assignee_name: user ? user.name : null,
          assignee_avatar: user ? user.avatar_url : null,
          assignee_email: user ? user.email : null,
          project_name: project ? project.name : null
        };
      });

      enriched.sort((a, b) => (a.position - b.position) || (a.id - b.id));
      return res.json(enriched);
    }
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, status = 'TODO', priority = 'MEDIUM', due_date, project_id, assigned_to } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      // Get max position in target column
      const posRes = await pool.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM tasks WHERE status = $1 AND project_id = $2',
        [status, project_id || 1]
      );
      const nextPos = posRes.rows[0].next_pos;

      const result = await pool.query(
        `INSERT INTO tasks (title, description, status, priority, due_date, position, project_id, assigned_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          title.trim(),
          description || '',
          status,
          priority.toUpperCase(),
          due_date || null,
          nextPos,
          project_id ? parseInt(project_id, 10) : 1,
          assigned_to ? parseInt(assigned_to, 10) : null
        ]
      );

      const created = result.rows[0];
      // Attach user & project info
      if (created.assigned_to) {
        const uRes = await pool.query('SELECT name, avatar_url, email FROM users WHERE id = $1', [created.assigned_to]);
        if (uRes.rows[0]) {
          created.assignee_name = uRes.rows[0].name;
          created.assignee_avatar = uRes.rows[0].avatar_url;
          created.assignee_email = uRes.rows[0].email;
        }
      }

      return res.status(201).json(created);
    } else {
      // In-memory
      const pId = project_id ? parseInt(project_id, 10) : 1;
      const colTasks = memStore.tasks.filter(t => t.status === status && t.project_id === pId);
      const nextPos = colTasks.length > 0 ? Math.max(...colTasks.map(t => t.position)) + 1 : 0;

      const newTask = {
        id: memStore.nextTaskId++,
        title: title.trim(),
        description: description || '',
        status: status || 'TODO',
        priority: (priority || 'MEDIUM').toUpperCase(),
        due_date: due_date || null,
        position: nextPos,
        project_id: pId,
        assigned_to: assigned_to ? parseInt(assigned_to, 10) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      memStore.tasks.push(newTask);

      const user = memStore.users.find(u => u.id === newTask.assigned_to);
      const project = memStore.projects.find(p => p.id === newTask.project_id);

      return res.status(201).json({
        ...newTask,
        assignee_name: user ? user.name : null,
        assignee_avatar: user ? user.avatar_url : null,
        assignee_email: user ? user.email : null,
        project_name: project ? project.name : null
      });
    }
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

// PATCH /api/tasks/:id/status - Update task status and position (drag & drop)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, position } = req.body;

    if (!status || !['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be TODO, IN_PROGRESS, or DONE.' });
    }

    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      const result = await pool.query(
        `UPDATE tasks 
         SET status = $1, 
             position = COALESCE($2, position), 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [status, position !== undefined ? parseInt(position, 10) : null, parseInt(id, 10)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      return res.json(result.rows[0]);
    } else {
      const task = memStore.tasks.find(t => t.id === parseInt(id, 10));
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      task.status = status;
      if (position !== undefined) {
        task.position = parseInt(position, 10);
      }
      task.updated_at = new Date().toISOString();

      return res.json(task);
    }
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({ error: 'Failed to update task status', details: err.message });
  }
});

// PATCH /api/tasks/:id - Update full task details
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, assigned_to, project_id } = req.body;
    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      const result = await pool.query(
        `UPDATE tasks 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             status = COALESCE($3, status),
             priority = COALESCE($4, priority),
             due_date = COALESCE($5, due_date),
             assigned_to = COALESCE($6, assigned_to),
             project_id = COALESCE($7, project_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [
          title ? title.trim() : null,
          description !== undefined ? description : null,
          status || null,
          priority ? priority.toUpperCase() : null,
          due_date !== undefined ? (due_date || null) : null,
          assigned_to !== undefined ? (assigned_to ? parseInt(assigned_to, 10) : null) : null,
          project_id ? parseInt(project_id, 10) : null,
          parseInt(id, 10)
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const updated = result.rows[0];
      if (updated.assigned_to) {
        const uRes = await pool.query('SELECT name, avatar_url, email FROM users WHERE id = $1', [updated.assigned_to]);
        if (uRes.rows[0]) {
          updated.assignee_name = uRes.rows[0].name;
          updated.assignee_avatar = uRes.rows[0].avatar_url;
        }
      }

      return res.json(updated);
    } else {
      const task = memStore.tasks.find(t => t.id === parseInt(id, 10));
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (title !== undefined) task.title = title.trim();
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority.toUpperCase();
      if (due_date !== undefined) task.due_date = due_date || null;
      if (assigned_to !== undefined) task.assigned_to = assigned_to ? parseInt(assigned_to, 10) : null;
      if (project_id !== undefined) task.project_id = parseInt(project_id, 10);
      task.updated_at = new Date().toISOString();

      const user = memStore.users.find(u => u.id === task.assigned_to);
      const project = memStore.projects.find(p => p.id === task.project_id);

      return res.json({
        ...task,
        assignee_name: user ? user.name : null,
        assignee_avatar: user ? user.avatar_url : null,
        project_name: project ? project.name : null
      });
    }
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
});

// DELETE /api/tasks/:id - Remove task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [parseInt(id, 10)]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.json({ message: 'Task deleted successfully', id: parseInt(id, 10) });
    } else {
      const idx = memStore.tasks.findIndex(t => t.id === parseInt(id, 10));
      if (idx === -1) {
        return res.status(404).json({ error: 'Task not found' });
      }
      memStore.tasks.splice(idx, 1);
      return res.json({ message: 'Task deleted successfully', id: parseInt(id, 10) });
    }
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

export default router;

import express from 'express';
import { pool, memStore, getDBStatus } from '../db.js';

const router = express.Router();

// GET /api/projects - List all projects
router.get('/', async (req, res) => {
  try {
    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      const result = await pool.query(`
        SELECT p.*,
               COUNT(DISTINCT pm.user_id)::int AS member_count,
               COUNT(DISTINCT t.id)::int AS task_count
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id
        ORDER BY p.id ASC
      `);
      return res.json(result.rows);
    } else {
      const enriched = memStore.projects.map(p => {
        const memberCount = memStore.project_members.filter(pm => pm.project_id === p.id).length;
        const taskCount = memStore.tasks.filter(t => t.project_id === p.id).length;
        return {
          ...p,
          member_count: memberCount,
          task_count: taskCount
        };
      });
      return res.json(enriched);
    }
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects', details: err.message });
  }
});

// POST /api/projects - Create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      const result = await pool.query(
        `INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *`,
        [name.trim(), description || '']
      );
      const project = result.rows[0];
      return res.status(201).json({ ...project, member_count: 0, task_count: 0 });
    } else {
      const newProj = {
        id: memStore.nextProjectId++,
        name: name.trim(),
        description: description || '',
        created_at: new Date().toISOString(),
        member_count: 0,
        task_count: 0
      };
      memStore.projects.push(newProj);
      return res.status(201).json(newProj);
    }
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
});

// GET /api/projects/:id/members - List members for a project
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      const result = await pool.query(`
        SELECT pm.id as membership_id, pm.role, pm.created_at as joined_at,
               u.id as user_id, u.name, u.email, u.avatar_url, u.role as job_title
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = $1
        ORDER BY pm.id ASC
      `, [parseInt(id, 10)]);

      return res.json(result.rows);
    } else {
      const pId = parseInt(id, 10);
      const members = memStore.project_members.filter(pm => pm.project_id === pId);
      const enriched = members.map(pm => {
        const u = memStore.users.find(user => user.id === pm.user_id);
        return {
          membership_id: pm.id,
          role: pm.role,
          user_id: u ? u.id : pm.user_id,
          name: u ? u.name : 'Unknown User',
          email: u ? u.email : '',
          avatar_url: u ? u.avatar_url : '',
          job_title: u ? u.role : 'Member'
        };
      });
      return res.json(enriched);
    }
  } catch (err) {
    console.error('Error fetching project members:', err);
    res.status(500).json({ error: 'Failed to fetch members', details: err.message });
  }
});

// POST /api/projects/:id/members - Add user to project
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role = 'MEMBER' } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const projectId = parseInt(id, 10);
    const userId = parseInt(user_id, 10);
    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      const check = await pool.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (check.rows.length > 0) {
        return res.status(409).json({ error: 'User is already a member of this project' });
      }

      const result = await pool.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [projectId, userId, role.toUpperCase()]
      );

      const uRes = await pool.query('SELECT name, email, avatar_url, role as job_title FROM users WHERE id = $1', [userId]);
      return res.status(201).json({
        membership_id: result.rows[0].id,
        role: result.rows[0].role,
        user_id: userId,
        name: uRes.rows[0]?.name,
        email: uRes.rows[0]?.email,
        avatar_url: uRes.rows[0]?.avatar_url,
        job_title: uRes.rows[0]?.job_title
      });
    } else {
      const exists = memStore.project_members.some(pm => pm.project_id === projectId && pm.user_id === userId);
      if (exists) {
        return res.status(409).json({ error: 'User is already a member of this project' });
      }

      const newMembership = {
        id: memStore.nextMemberId++,
        project_id: projectId,
        user_id: userId,
        role: role.toUpperCase()
      };
      memStore.project_members.push(newMembership);

      const u = memStore.users.find(user => user.id === userId);
      return res.status(201).json({
        membership_id: newMembership.id,
        role: newMembership.role,
        user_id: userId,
        name: u ? u.name : 'Unknown User',
        email: u ? u.email : '',
        avatar_url: u ? u.avatar_url : '',
        job_title: u ? u.role : 'Member'
      });
    }
  } catch (err) {
    console.error('Error adding project member:', err);
    res.status(500).json({ error: 'Failed to add member to project', details: err.message });
  }
});

export default router;

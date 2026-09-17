import express from 'express';
import { pool, memStore, getDBStatus } from '../db.js';

const router = express.Router();

// GET /api/users - List all users
router.get('/', async (req, res) => {
  try {
    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      const result = await pool.query(`
        SELECT id, name, email, avatar_url, role, created_at
        FROM users
        ORDER BY name ASC
      `);
      return res.json(result.rows);
    } else {
      return res.json(memStore.users);
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, avatar_url, role = 'Contributor' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const defaultAvatar = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    const dbStatus = getDBStatus();

    if (dbStatus.usingNeon && pool) {
      const result = await pool.query(
        `INSERT INTO users (name, email, avatar_url, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, avatar_url, role, created_at`,
        [name.trim(), email.trim().toLowerCase(), defaultAvatar, role.trim()]
      );
      return res.status(201).json(result.rows[0]);
    } else {
      const newUser = {
        id: memStore.nextUserId++,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        avatar_url: defaultAvatar,
        role: role.trim(),
        created_at: new Date().toISOString()
      };
      memStore.users.push(newUser);
      return res.status(201).json(newUser);
    }
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

export default router;

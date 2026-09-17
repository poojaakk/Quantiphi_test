import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB, getDBStatus } from './db.js';
import tasksRouter from './routes/tasks.js';
import projectsRouter from './routes/projects.js';
import usersRouter from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/users', usersRouter);

// Health & DB Connection Status
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Kanban Task Management API is running' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Initialize DB and start server
async function start() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();

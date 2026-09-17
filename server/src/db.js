import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Check for DATABASE_URL (Neon PostgreSQL connection string)
const connectionString = process.env.DATABASE_URL;

let pool = null;
let isConnected = false;
let dbType = 'none';

// In-memory fallback store in case Neon credentials are not yet supplied
const memStore = {
  users: [
    { id: 1, name: 'Alex Rivera', email: 'alex@company.com', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', role: 'Lead Engineer' },
    { id: 2, name: 'Sarah Chen', email: 'sarah@company.com', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', role: 'Product Designer' },
    { id: 3, name: 'Marcus Brody', email: 'marcus@company.com', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', role: 'Full Stack Dev' }
  ],
  projects: [
    { id: 1, name: 'Nova Cloud Platform', description: 'Modern cloud infrastructure and real-time collaboration suite' },
    { id: 2, name: 'Mobile App Redesign', description: 'Next-gen iOS and Android experience' }
  ],
  project_members: [
    { id: 1, project_id: 1, user_id: 1, role: 'OWNER' },
    { id: 2, project_id: 1, user_id: 2, role: 'MEMBER' },
    { id: 3, project_id: 1, user_id: 3, role: 'MEMBER' },
    { id: 4, project_id: 2, user_id: 2, role: 'OWNER' },
    { id: 5, project_id: 2, user_id: 3, role: 'MEMBER' }
  ],
  tasks: [
    {
      id: 1,
      title: 'Architect PostgreSQL schema on Neon',
      description: 'Define relational models for projects, hierarchical tasks, and member permissions with foreign keys.',
      status: 'TODO',
      priority: 'HIGH',
      due_date: '2026-09-25',
      position: 0,
      project_id: 1,
      assigned_to: 1
    },
    {
      id: 2,
      title: 'Design high-fidelity Kanban UI components',
      description: 'Craft responsive column headers, status badges, priority tags, and accessible drop zones.',
      status: 'TODO',
      priority: 'MEDIUM',
      due_date: '2026-09-28',
      position: 1,
      project_id: 1,
      assigned_to: 2
    },
    {
      id: 3,
      title: 'Implement drag-and-drop state synchronization',
      description: 'Enable seamless card transitions across To-Do, In Progress, and Done columns with optimistic UI updates.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      due_date: '2026-09-20',
      position: 0,
      project_id: 1,
      assigned_to: 3
    },
    {
      id: 4,
      title: 'Integrate team member assignment modal',
      description: 'Allow project leads to assign contributors and set roles (Owner, Admin, Member).',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      due_date: '2026-09-22',
      position: 1,
      project_id: 1,
      assigned_to: 1
    },
    {
      id: 5,
      title: 'Initialize repository structure & Express boilerplate',
      description: 'Configured Node.js backend with REST CRUD endpoints and Vite React client.',
      status: 'DONE',
      priority: 'LOW',
      due_date: '2026-09-15',
      position: 0,
      project_id: 1,
      assigned_to: 3
    },
    {
      id: 6,
      title: 'Setup CORS and environment configuration',
      description: 'Configured environment variable loaders and cross-origin middleware for seamless frontend communication.',
      status: 'DONE',
      priority: 'MEDIUM',
      due_date: '2026-09-16',
      position: 1,
      project_id: 1,
      assigned_to: 1
    }
  ],
  nextTaskId: 7,
  nextProjectId: 3,
  nextUserId: 4,
  nextMemberId: 6
};

export async function initDB() {
  if (!connectionString) {
    console.log('ℹ️ No DATABASE_URL provided. Running with memory store.');
    dbType = 'memory';
    isConnected = true;
    return;
  }

  try {
    console.log('🔌 Connecting to Neon PostgreSQL...');
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    const client = await pool.connect();
    console.log(' Connected to PostgreSQL / Neon successfully!');
    dbType = 'neon-postgres';
    isConnected = true;

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        avatar_url TEXT,
        role VARCHAR(100) DEFAULT 'Contributor',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'MEMBER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'TODO',
        priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
        due_date DATE,
        position INT DEFAULT 0,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if seed data exists
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCount.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial demo data into Neon DB...');
      
      // Insert users
      const uRes = await client.query(`
        INSERT INTO users (name, email, avatar_url, role) VALUES
        ('Alex Rivera', 'alex@company.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', 'Lead Engineer'),
        ('Sarah Chen', 'sarah@company.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', 'Product Designer'),
        ('Marcus Brody', 'marcus@company.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', 'Full Stack Dev')
        RETURNING id;
      `);
      const u1 = uRes.rows[0].id;
      const u2 = uRes.rows[1].id;
      const u3 = uRes.rows[2].id;

      // Insert projects
      const pRes = await client.query(`
        INSERT INTO projects (name, description) VALUES
        ('Nova Cloud Platform', 'Modern cloud infrastructure and real-time collaboration suite'),
        ('Mobile App Redesign', 'Next-gen iOS and Android experience')
        RETURNING id;
      `);
      const p1 = pRes.rows[0].id;
      const p2 = pRes.rows[1].id;

      // Insert project members
      await client.query(`
        INSERT INTO project_members (project_id, user_id, role) VALUES
        ($1, $2, 'OWNER'),
        ($1, $3, 'MEMBER'),
        ($1, $4, 'MEMBER'),
        ($5, $3, 'OWNER'),
        ($5, $4, 'MEMBER');
      `, [p1, u1, u2, u3, p2]);

      // Insert tasks
      await client.query(`
        INSERT INTO tasks (title, description, status, priority, due_date, position, project_id, assigned_to) VALUES
        ('Architect PostgreSQL schema on Neon', 'Define relational models for projects, hierarchical tasks, and member permissions with foreign keys.', 'TODO', 'HIGH', '2026-09-25', 0, $1, $2),
        ('Design high-fidelity Kanban UI components', 'Craft responsive column headers, status badges, priority tags, and accessible drop zones.', 'TODO', 'MEDIUM', '2026-09-28', 1, $1, $3),
        ('Implement drag-and-drop state synchronization', 'Enable seamless card transitions across To-Do, In Progress, and Done columns with optimistic UI updates.', 'IN_PROGRESS', 'URGENT', '2026-09-20', 0, $1, $4),
        ('Integrate team member assignment modal', 'Allow project leads to assign contributors and set roles (Owner, Admin, Member).', 'IN_PROGRESS', 'HIGH', '2026-09-22', 1, $1, $2),
        ('Initialize repository structure & Express boilerplate', 'Configured Node.js backend with REST CRUD endpoints and Vite React client.', 'DONE', 'LOW', '2026-09-15', 0, $1, $4),
        ('Setup CORS and environment configuration', 'Configured environment variable loaders and cross-origin middleware for seamless frontend communication.', 'DONE', 'MEDIUM', '2026-09-16', 1, $1, $2);
      `, [p1, u1, u2, u3, u4]);

      console.log('✅ Demo seed complete in Neon PostgreSQL.');
    }

    client.release();
  } catch (err) {
    console.error('⚠️ Failed connecting to PostgreSQL/Neon:', err.message);
    console.log('🔄 Falling back to in-memory store.');
    dbType = 'memory-fallback';
    isConnected = true;
  }
}

export function getDBStatus() {
  return {
    connected: isConnected,
    type: dbType,
    usingNeon: dbType === 'neon-postgres'
  };
}

export { pool, memStore };

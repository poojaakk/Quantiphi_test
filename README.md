<div align="center">

# ⚡ FlowBoard
### Streamlined Kanban Task Management Application

*Built with React.js, Node.js (Express), and PostgreSQL (Neon Serverless)*

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00E599?logo=postgresql&logoColor=white)](https://neon.tech/)

</div>

---

## 📖 Overview

**FlowBoard** is a full-stack, Kanban-style productivity application engineered for both personal workflows and team project tracking. It features an interactive three-column drag-and-drop board, priority tag filtering, team member assignment with permission tiers, and a relational database backend powered by **Neon Serverless PostgreSQL**.

---

## ✨ Key Features

### 🎯 Frontend UI & User Interaction
- **Interactive Kanban Board**: Three columns (**To-Do**, **In Progress**, **Done**) with smooth drag-and-drop powered by `@hello-pangea/dnd` and optimistic UI updates.
- **Rich Task Cards**:
  - **Priority Tags**: `URGENT` (Red), `HIGH` (Amber), `MEDIUM` (Blue), `LOW` (Slate) with distinct indicator badges.
  - **Due Dates**: Formatted calendar indicators with automatic red-alert overdue detection.
  - **Assignee Avatars**: User avatar chips, initials fallback, job title tooltips, and unassigned indicators.
  - **Quick Actions**: Inline edit and delete controls with confirmation guards.
- **Productivity & Filtering Controls**:
  - **Priority Pills**: Quick-filter tasks by `All`, `Urgent`, `High`, `Medium`, or `Low`.
  - **Live Search**: Instant keyword matching across task titles, descriptions, and assignee names.
  - **Project Switcher**: Dropdown to toggle between distinct project boards.
  - **Progress Dashboard**: Dynamic completion percentage bar with live counts for To-Do, In Progress, and Completed tasks.
- **User & Project Modals**:
  - **Create Task Modal**: Add new tasks with title, description, column, priority, due date, and assigned member.
  - **Add Member Modal**: Add existing users to the current project with specific roles (`OWNER`, `ADMIN`, `MEMBER`), or create brand-new team member profiles on the fly.
  - **Create Project Modal**: Initialize new workspaces with project name and description.

### ⚙️ Backend Logic & Relational Data
- **Custom CRUD API**: Express REST endpoints for tasks, projects, project members, and user profiles.
- **PostgreSQL (Neon) Hierarchy**:
  - Relational mapping between **Projects → Tasks** and **Users → Project Members**.
  - Foreign key constraints with cascading deletes for project cleanup.
  - Automatic migration on startup: creates all tables and constraints automatically.
  - Automatic seed routine: pre-populates starter projects, team members, and tasks if empty.
- **Instant Zero-Config Fallback**:
  - If `DATABASE_URL` is not yet configured, the server boots instantly with an in-memory database store so that frontend and backend can be previewed immediately.
  - Adding the Neon connection string automatically activates live PostgreSQL storage.

---

## 🏛️ Database Architecture & Entity Relationship

```mermaid
erDiagram
    USERS ||--o{ PROJECT_MEMBERS : "is assigned to"
    PROJECTS ||--o{ PROJECT_MEMBERS : "has members"
    PROJECTS ||--o{ TASKS : "contains"
    USERS ||--o{ TASKS : "assigned to"

    USERS {
        int id PK
        string name
        string email UK
        string avatar_url
        string role
        timestamp created_at
    }

    PROJECTS {
        int id PK
        string name
        text description
        timestamp created_at
    }

    PROJECT_MEMBERS {
        int id PK
        int project_id FK
        int user_id FK
        string role
        timestamp created_at
    }

    TASKS {
        int id PK
        string title
        text description
        string status
        string priority
        date due_date
        int position
        int project_id FK
        int assigned_to FK
        timestamp created_at
        timestamp updated_at
    }
```

---

## 📁 Repository Structure

```
Quantiphi_test/
├── client/                     # Frontend Application (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── KanbanBoard.jsx   # DragDropContext container for all columns
│   │   │   ├── KanbanColumn.jsx  # Individual column drop target & card list
│   │   │   ├── TaskCard.jsx      # Draggable card item with priority & user badge
│   │   │   ├── TaskModal.jsx     # Task creation and editing dialog
│   │   │   ├── AddUserModal.jsx  # Assign member or create user dialog
│   │   │   ├── ProjectModal.jsx  # Create new project dialog
│   │   │   ├── FilterBar.jsx     # Priority pills, search input, project switcher
│   │   │   └── Navbar.jsx        # App header & Neon live connection status badge
│   │   ├── services/
│   │   │   └── api.js            # Fetch client for all REST endpoints
│   │   ├── App.jsx               # Main state orchestrator, optimistic updates, toast
│   │   ├── index.css             # Tailwind styling & custom scrollbars
│   │   └── main.jsx              # React DOM mounting
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Backend Service (Node.js + Express)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── tasks.js          # Task CRUD & drag-drop position/status updates
│   │   │   ├── projects.js       # Project listing & team member associations
│   │   │   └── users.js          # User profile management
│   │   ├── db.js                 # Neon connection pool, migration, and seed logic
│   │   └── index.js              # Server entry point & health check
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json                # Root automation scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- (Optional) Free **Neon** PostgreSQL database account ([neon.tech](https://neon.tech))

---

### Step 1: Install Dependencies

From the repository root:
```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install

# Return to root
cd ..
```

---

### Step 2: Configure Environment (Neon PostgreSQL)

1. Create a free PostgreSQL database at [Neon Console](https://console.neon.tech).
2. Copy your connection string (it looks like: `postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require`).
3. Create `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```
4. Paste your connection URL into `server/.env`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_xyz@ep-cool-cloud-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   PORT=5001
   ```

> 💡 **Zero-Config Option**: If you skip this step or leave `DATABASE_URL` commented out, the application will automatically start with the built-in interactive in-memory store populated with realistic starter tasks, projects, and users.

---

### Step 3: Run the Application

You can launch both services using the convenient root scripts:

#### Terminal 1 — Start Backend Server:
```bash
npm run dev:server
# Server starts at: http://localhost:5001
```

#### Terminal 2 — Start Frontend Client:
```bash
npm run dev:client
# Frontend starts at: http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser!

---

## 📡 REST API Reference

### 🏥 System & Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns server uptime and PostgreSQL/Neon connection status |

**Sample Response (`/api/health`)**:
```json
{
  "status": "ok",
  "timestamp": "2026-09-17T15:19:27.415Z",
  "database": {
    "connected": true,
    "type": "neon-postgres",
    "usingNeon": true
  }
}
```

---

### 📋 Tasks API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | Get all tasks. Query params: `projectId`, `priority`, `search`, `assignedTo` |
| `POST` | `/api/tasks` | Create a new task |
| `PATCH` | `/api/tasks/:id` | Update task details (title, description, priority, due date, assignee) |
| `PATCH` | `/api/tasks/:id/status` | Move task to new column (`TODO`, `IN_PROGRESS`, `DONE`) and position |
| `DELETE` | `/api/tasks/:id` | Delete task by ID |

**Sample Request Body (`POST /api/tasks`)**:
```json
{
  "title": "Build real-time notification service",
  "description": "Trigger WebSocket events when cards move columns",
  "status": "TODO",
  "priority": "HIGH",
  "due_date": "2026-10-01",
  "project_id": 1,
  "assigned_to": 2
}
```

**Sample Request Body (`PATCH /api/tasks/:id/status`)**:
```json
{
  "status": "DONE",
  "position": 0
}
```

---

### 📁 Projects & Team Members API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List all projects with aggregated task count and member count |
| `POST` | `/api/projects` | Create a new project workspace |
| `GET` | `/api/projects/:id/members` | Get all assigned team members for a project |
| `POST` | `/api/projects/:id/members` | Assign a user to a project with a role (`OWNER`, `ADMIN`, `MEMBER`) |

---

### 👤 Users API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all registered user profiles |
| `POST` | `/api/users` | Create a new user profile |

**Sample Request Body (`POST /api/users`)**:
```json
{
  "name": "Maya Patel",
  "email": "maya@company.com",
  "role": "QA Automation Lead"
}
```

---

## 🛠️ Build for Production

To create an optimized production build of the frontend:

```bash
npm run build
```
Built assets will be compiled into `client/dist/`.

---

## 📝 License
This project is open source and available under the [MIT License](LICENSE).

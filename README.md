# FlowBoard — Smart Project & Task Collaboration System

A full-stack web application for teams to manage projects, tasks, members, and work progress with real-time updates, role-based access control, and rich analytics.

---

## Live Demo

| Resource | Link |
|----------|------|
| **Live Application** | `https://taskeo-blue.vercel.app/` |
| **GitHub Repository** | `https://github.com/your-username/flowboard` |
| **API Base URL** | `https://taskeo-backend.onrender.com` |

> Replace the URLs above with your actual deployment links before submission.

---

## Demo Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@demo.com | Demo@1234 | Full system access |
| **Project Manager** | pm@demo.com | Demo@1234 | Create/manage projects & assign tasks |
| **Team Member** | john@demo.com | Demo@1234 | Update assigned tasks only |

A **Demo Login** button on the login page pre-fills the Admin credentials automatically.

---

## Features Overview

### Authentication
- Email + password signup and login
- JWT access token (15 min) + refresh token (7 days) with Redis-backed blacklist
- Role-based access control: Admin, Project Manager, Team Member
- Post-login redirect to dashboard
- Demo login button with pre-filled credentials

### Project Management
- Create, update, delete, and view projects
- Fields: name, description, deadline, status (Active / Completed / On Hold)
- Per-project stats: total tasks, completion percentage, overdue count

### Task Management
- Full CRUD for tasks under projects
- Fields: title, description, assigned member, due date, priority (High/Medium/Low), status (Todo / In Progress / Completed)
- Quick status update endpoint
- View tasks by project, status, priority, or assignee

### Task Validation & Conflict Handling
- Duplicate task titles within the same project are rejected
- Completed tasks cannot be reassigned
- Past dates are rejected as due dates
- Assignees must be project members

### Team Collaboration
- Add and remove team members from projects
- Assign tasks to specific members
- Per-member task list view
- Workload summary: total, completed, and pending tasks per member

### Progress Tracking
- Dashboard KPI cards: total projects, tasks, completed, pending, overdue
- Per-project completion percentage and deadline proximity
- Overdue task detection

### Activity Log
- 14 tracked action types (project CRUD, task CRUD, member changes, comments, files)
- Infinite scroll timeline with timestamps and actor info
- Accessible from the sidebar

### Dashboard & Analytics
- KPI cards with role-scoped data
- Charts: tasks by priority (pie), task status distribution (pie), project progress trend (area), team productivity overview (bar)
- Member workload summary with progress bars
- Upcoming deadlines (next 7 days)
- High priority task list
- Recent activity feed

### Search, Filtering & Productivity
- Search: projects by name, tasks by title/description, members by name
- Filters: project status, task status, priority, assignee, deadline status (upcoming/overdue)
- Sorting: latest created, nearest deadline, highest priority, recently updated
- Pagination on all list endpoints
- Bulk task actions (select all, bulk status change, bulk delete)
- Quick task status toggle

### Additional Features
- Dark / Light mode toggle (persisted across sessions)
- File attachments on tasks (Cloudinary, 10 MB limit, PDF/images/Office files)
- Comments on tasks (create, edit, delete)
- Notification system with unread badge (7 notification types)
- Real-time updates via Socket.IO (task created/updated/deleted/status changed)
- Analytics page with all charts

---

## Tech Stack

### Frontend (`/public`)
| Technology | Purpose |
|-----------|---------|
| Next.js 15 (App Router) | React framework |
| TypeScript (strict) | Type safety |
| Tailwind CSS v4 | Styling |
| Zustand | Auth + UI state |
| TanStack Query v5 | Server state + caching |
| React Hook Form + Zod | Form validation |
| Recharts | Charts |
| Axios | HTTP client with JWT interceptor |
| Socket.IO Client | Real-time updates |

### Backend (`/prisma`)
| Technology | Purpose |
|-----------|---------|
| NestJS | Node.js framework |
| TypeScript | Type safety |
| Prisma | ORM |
| PostgreSQL (Neon) | Primary database |
| Redis (Upstash) | Refresh token blacklist |
| JWT + bcrypt | Auth tokens + password hashing |
| Socket.IO | WebSocket gateway |
| Cloudinary | File storage |
| class-validator | DTO validation |

---

## Project Structure

```
flowboard/
├── public/                    # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── (auth)/        # login, signup pages
│       │   └── (dashboard)/   # all protected pages
│       │       ├── dashboard/
│       │       ├── projects/
│       │       ├── tasks/
│       │       ├── team/
│       │       ├── members/
│       │       ├── analytics/
│       │       ├── activity/
│       │       ├── notifications/
│       │       └── settings/
│       ├── components/
│       │   ├── ui/            # design system primitives
│       │   ├── layout/        # sidebar, header
│       │   ├── projects/      # project cards & forms
│       │   ├── tasks/         # task cards & forms
│       │   └── dashboard/     # KPI cards
│       ├── services/api.ts    # all API calls
│       ├── store/             # Zustand stores
│       ├── types/index.ts     # TypeScript interfaces
│       ├── lib/utils.ts       # helpers
│       └── lib/api-client.ts  # axios + interceptors
│
└── prisma/                    # NestJS backend
    ├── src/
    │   ├── auth/              # JWT auth, guards, strategies
    │   ├── projects/          # project CRUD
    │   ├── tasks/             # task CRUD + validation
    │   ├── team/              # project membership
    │   ├── users/             # user management
    │   ├── comments/          # task comments
    │   ├── attachments/       # file uploads (Cloudinary)
    │   ├── notifications/     # notification system
    │   ├── activity-logs/     # audit trail
    │   ├── analytics/         # dashboard + charts data
    │   ├── events/            # Socket.IO gateway
    │   └── common/            # guards, decorators, exceptions
    └── prisma/
        ├── schema.prisma      # database schema
        ├── seed.ts            # demo data seed
        └── migrations/        # SQL migrations
```

---

## Environment Variables

### Frontend — `public/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Backend — `prisma/.env`

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# JWT
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis (for token blacklist)
REDIS_URL="rediss://default:password@host:6379"

# Cloudinary (file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# App
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3001"
```

---

## Local Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (or Neon free tier)
- Redis instance (or Upstash free tier)
- Cloudinary account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/flowboard.git
cd 
```

### 2. Set up the backend

```bash
cd prisma

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your DATABASE_URL, JWT_SECRET, REDIS_URL, CLOUDINARY_* values

# Run database migrations
npx prisma migrate deploy

# Seed demo data (creates demo users and sample projects)
npx prisma db seed

# Start development server (runs on port 3000)
npm run start:dev
```

### 3. Set up the frontend

```bash
cd ../public

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Start development server (runs on port 3001)
npm run dev
```

### 4. Open the app

Visit **http://localhost:3001** and click **Try Demo Account** to log in instantly.

---

## Deployment Instructions

### Backend — Railway (recommended)

1. Push `prisma/` to a GitHub repo (or use a monorepo)
2. Create a new project on [railway.app](https://railway.app)
3. Connect your GitHub repo and select the `prisma/` root directory
4. Add all environment variables from the list above
5. Railway auto-detects NestJS and builds with `npm run start:prod`
6. After deploy, run the seed: open Railway shell → `npx prisma db seed`

### Frontend — Vercel (recommended)

1. Push `public/` to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set root directory to `public/`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app`
5. Deploy — Vercel auto-detects Next.js

### Database — Neon (free PostgreSQL)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string into `DATABASE_URL`
3. Run `npx prisma migrate deploy` from the `prisma/` directory

### Redis — Upstash (free Redis)

1. Create a free database at [upstash.com](https://upstash.com)
2. Copy the `REDIS_URL` (starts with `rediss://`) into your env

---

## API Documentation

Once the backend is running, Swagger UI is available at:

```
http://localhost:3000/api
```

All endpoints are documented with request/response schemas and require a Bearer JWT token (except `/auth/login` and `/auth/signup`).

---

## Running Tests

```bash
cd prisma

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```
# FlowBoard Frontend

Production-grade project & task management system built with **Next.js 15**, **TypeScript**, **Tailwind CSS v4**, and a custom dark UI design system.

## Tech Stack
- **Framework**: Next.js 15 App Router
- **Language**: TypeScript (strict, zero errors)
- **Styling**: Tailwind CSS v4 + CSS Custom Properties design system
- **UI**: Radix UI primitives + fully custom components
- **State**: Zustand (auth + UI) + TanStack React Query v5
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts (Area, Bar, Pie)
- **HTTP**: Axios with JWT interceptor + auto token refresh

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# 3. Run dev server
npm run dev
# Opens at http://localhost:3001
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | Demo@1234 |
| Project Manager | pm@demo.com | Demo@1234 |
| Team Member | john@demo.com | Demo@1234 |

## Features
- Dashboard with KPI cards, charts, activity feed
- Projects: CRUD, grid/list view, search & filter, pagination
- Project detail: Kanban board + list view
- Tasks: global task list with multi-filter
- Task detail: status change, comment thread
- Team: member directory with workload stats
- Analytics: charts for progress, priority, productivity
- Notifications: mark read/all-read with live badge
- Activity: timeline log
- Settings: profile edit, role info

## Structure
```
src/
  app/(auth)/          — login, signup
  app/(dashboard)/     — all protected pages
  components/ui/       — design system primitives
  components/layout/   — sidebar, header
  components/projects/ — project cards & forms
  components/tasks/    — task cards & forms
  services/api.ts      — all API calls
  store/               — Zustand stores
  types/index.ts       — TypeScript interfaces
  lib/utils.ts         — helpers
  lib/api-client.ts    — axios + interceptors
```

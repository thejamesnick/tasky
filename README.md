# Tasky

**Tasky** is a productivity web app that combines a rich-text note editor with a daily task manager. It's built around a "Living Journal" philosophy — every sheet automatically gives you a fresh, clean slate each day while keeping your history safely archived.

---

## The Living Journal Concept

Most to-do apps turn into a *Wall of Shame* by Friday. You open the app and stare at Monday's leftovers mixed with Tuesday's, and Wednesday's. It stops feeling like a tool and starts feeling like more work.

Tasky solves this with the **Living Journal** model:

- **Sheets are Books, not Files.** A sheet called "Work" is an identity that persists over time — like a journal volume. Each day it opens to a fresh page.
- **Virtual Rollover.** When you open a sheet the next day, Tasky instantly renders a clean slate in the UI *without touching the database*. The moment you type your first character, it silently creates the new day's entry in the background. Zero friction, no buttons to click.
- **Per-day color vibes.** Each day's entry has its own color. Monday might be high-energy red; Tuesday might be chill blue. Changing today's color doesn't affect yesterday's history.

---

## Features

- **Sheets** — rich-text notes with an embedded task/checklist editor (powered by TipTap). Each sheet tracks how many tasks are complete out of the total.
- **Daily View** — a standalone task list for each day. Navigate to any date and see what was on the agenda. Yesterday's undone tasks are preserved in the archive.
- **Auto-save** — content is saved automatically as you type (debounced, 1 s).
- **History Stack** — browse past daily pages for any sheet via the history panel.
- **Color Coding** — pick a color per daily entry to match your mood or priority level.
- **Reminders** — attach a time reminder to any daily task.
- **Sidebar navigation** — collapsible sidebar with all your sheets; mobile-responsive and full-screen on smaller devices.
- **Authentication** — secure login via Supabase Auth with Row Level Security so each user only ever sees their own data.

---

## Tech Stack

### Frontend (`tasky-client`)
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Routing | React Router v7 |
| Editor | TipTap (with TaskList, TaskItem, Placeholder extensions) |
| Icons | Lucide React |
| Auth & DB | Supabase JS v2 |
| Fonts | Inter |
| PWA | vite-plugin-pwa |

### Backend (`tasky-server`)
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Server | Express 5 |
| Database | SQLite3 |
| Dev server | nodemon + ts-node |

> **Note:** The client uses Supabase directly for auth and its primary database. The standalone Express server (`tasky-server`) is a local SQLite-backed API used during early development and offline scenarios.

---

## Project Structure

```
tasky/
├── tasky-client/        # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/  # UI components (Layout, SheetView, DailyView, Editor …)
│   │   ├── context/     # LayoutContext (sticky header state)
│   │   ├── lib/         # API helpers & Supabase client
│   │   └── App.tsx      # Auth provider + routes
│   └── supabase_schema.sql  # Supabase table definitions & RLS policies
│
├── tasky-server/        # Express API (SQLite)
│   ├── src/
│   │   ├── index.ts     # Route definitions
│   │   ├── db.ts        # SQLite helper (query / run)
│   │   └── init-db.ts   # Database initialiser
│   └── schema.sql       # SQLite schema
│
└── DevLog/              # Architecture notes & design decisions
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Yarn 4 (corepack)
- A [Supabase](https://supabase.com) project (for the frontend)

### 1. Set up the database (Supabase)

Run `tasky-client/supabase_schema.sql` in your Supabase SQL editor. This creates the `sheets`, `tasks`, `tags`, and `task_tags` tables with Row Level Security policies.

### 2. Configure environment variables

Create `tasky-client/.env`:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Run the frontend

```bash
cd tasky-client
yarn install
yarn dev
```

The app is available at `http://localhost:5173`.

### 4. Run the local API server (optional)

```bash
cd tasky-server
yarn install
yarn db:init   # initialise SQLite database
yarn dev       # starts on http://localhost:3000
```

---

## Scripts

### tasky-client
| Command | Description |
|---|---|
| `yarn dev` | Start the Vite dev server |
| `yarn build` | Type-check and build for production |
| `yarn preview` | Preview the production build |
| `yarn lint` | Run ESLint |

### tasky-server
| Command | Description |
|---|---|
| `yarn dev` | Start dev server with nodemon |
| `yarn build` | Compile TypeScript to `dist/` |
| `yarn start` | Run the compiled server |
| `yarn db:init` | Initialise the SQLite database |

---

## Database Schema (Supabase)

| Table | Description |
|---|---|
| `sheets` | Notes / journal pages. Each row is one day's page; pages in the same journal share a `group_id`. |
| `tasks` | To-do items. Can belong to a sheet (`sheet_id`) or be standalone daily tasks (`sheet_id IS NULL`). |
| `tags` | User-defined labels for categorising tasks. |
| `task_tags` | Junction table linking tasks to tags. |

All tables have Row Level Security enabled — users can only read and write their own data.

---

## Design

- **Logo:** Green background with a white double-checkmark
- **Font:** Inter
- **Color palette:** Soft greens, purples, and neutrals — no harsh deep tones

---

*Built to learn backend and database fundamentals, and to make a to-do app that actually works the way humans think.*

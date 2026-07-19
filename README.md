# Activity Logger

A local-first personal operating system for recording, organizing, and visualizing your work history. Built for developers, researchers, freelancers, and knowledge workers who want a private, fast, and beautiful record of everything they do.

---

## What it does

Activity Logger answers questions you'll actually ask:

- What did I work on today?
- What did I accomplish this week?
- What projects am I actually progressing?
- Where is my time going?
- What evidence exists for my work?

---

## Screenshots

The UI is dark-first, minimal, and developer-focused — inspired by Linear, Notion, and Raycast.

---

## Architecture

```
activity-logger/
├── backend/                  FastAPI + SQLite
│   ├── app/
│   │   ├── api/v1/           REST endpoints
│   │   ├── core/             Config
│   │   ├── db/               SQLAlchemy async engine
│   │   ├── models/           ORM models
│   │   ├── schemas/          Pydantic schemas
│   │   └── services/         Business logic layer
│   ├── seed.py               Sample data generator
│   ├── tests/                pytest test suite
│   └── requirements.txt
├── frontend/                 Next.js 14 + TypeScript
│   └── src/
│       ├── app/              Pages (App Router)
│       ├── components/       Reusable UI components
│       ├── lib/              API client + utilities
│       └── types/            TypeScript interfaces
├── docker-compose.yml
└── README.md
```

**Backend stack:** FastAPI · SQLAlchemy (async) · SQLite · Pydantic v2 · Uvicorn

**Frontend stack:** Next.js 14 · TypeScript · Tailwind CSS · Recharts · Lucide Icons

**Infrastructure:** Docker · Docker Compose

---

## Quickstart

**Prerequisites:** Docker and Docker Compose installed.

```bash
git clone <repo-url>
cd activity-logger
docker compose up
```

Open [http://localhost:3000](http://localhost:3000).

The backend seeds realistic sample data automatically on first launch — projects, hundreds of activities, and tags — so the app looks fully populated immediately.

---

## Development

### Backend (local)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                     # seed sample data
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

### Frontend (local)

```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)

---

## API Reference

Base URL: `http://localhost:8000/api/v1`

Interactive OpenAPI docs at `/api/v1/docs`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Stats, trends, type breakdown |
| GET/POST | `/projects` | List / create projects |
| GET/PATCH/DELETE | `/projects/{id}` | Get / update / delete project |
| GET/POST | `/activities` | List (filterable) / create |
| GET/PATCH/DELETE | `/activities/{id}` | Get / update / delete activity |
| GET/POST | `/tags` | List / create tags |
| GET/POST | `/reports` | List / generate reports |
| GET | `/search?q=` | Full-text search |
| GET | `/export/json` | Export all data as JSON |
| GET | `/export/markdown` | Export all data as Markdown |

### Activity types

`file_edit` · `git_commit` · `git_push` · `note` · `terminal` · `browser_visit` · `meeting` · `research` · `review` · `deploy` · `test` · `build` · `documentation` · `bug_fix` · `feature` · `refactor` · `manual`

---

## Testing

### Backend

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm test
```

---

## Deployment

The app is designed for single-machine local use, but can be deployed to any Docker host.

### Environment variables

**Backend**
```
DATABASE_URL=sqlite+aiosqlite:///./data/activity_logger.db
ALLOWED_ORIGINS=["http://your-domain.com"]
```

**Frontend**
```
NEXT_PUBLIC_API_URL=http://your-backend-host:8000
```

Data is stored in a named Docker volume (`activity-data`) and persists across container restarts.

---

## Troubleshooting

**Backend fails to start**
- Check `docker compose logs backend`
- Ensure port 8000 is not already in use

**Frontend shows "Failed to fetch"**
- Confirm the backend container is healthy: `docker compose ps`
- The frontend uses `NEXT_PUBLIC_API_URL` — ensure it matches where the backend is reachable from the browser (not from inside Docker)

**Database is empty after restart**
- Data persists in the `activity-data` volume. Run `docker volume ls` to confirm it exists.
- To re-seed: `docker compose exec backend python seed.py`

**Port conflicts**
- Change ports in `docker-compose.yml`: `"8001:8000"` for backend, `"3001:3000"` for frontend, then update `NEXT_PUBLIC_API_URL` accordingly.

---

## Design principles

- **Local-first** — all data stays on your machine, zero external services
- **Privacy-first** — no telemetry, no analytics, no accounts
- **Fast** — SQLite with async I/O, instant UI responses
- **Beautiful** — dark-first, minimal, Linear-inspired interface

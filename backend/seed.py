#!/usr/bin/env python3
"""
Seed the database with realistic sample data.
Run: python seed.py
"""
import asyncio
import random
from datetime import datetime, timedelta, timezone
import uuid
import os

os.makedirs("./data", exist_ok=True)

from app.db.database import init_db, AsyncSessionLocal
from app.models.project import Project
from app.models.activity import Activity
from app.models.tag import Tag, ProjectTag, ActivityTag
from app.models.report import Report

PROJECTS = [
    {"name": "AURA Platform", "description": "AI-powered digital clone platform for personalized interactions", "color": "#6366f1", "status": "active"},
    {"name": "CLI Toolchain", "description": "Custom terminal utilities and shell scripts for developer workflow", "color": "#10b981", "status": "active"},
    {"name": "Portfolio Site", "description": "Personal developer portfolio with case studies and writing", "color": "#f59e0b", "status": "active"},
    {"name": "Habit Intelligence Engine", "description": "Dockerized habit tracker evolving into a personal BI system", "color": "#ec4899", "status": "active"},
    {"name": "Open Source Contributions", "description": "Upstream contributions to FastAPI, SQLAlchemy, and Tailwind ecosystem", "color": "#14b8a6", "status": "active"},
    {"name": "Research Notes", "description": "Structured notes and reading summaries on systems design and AI", "color": "#8b5cf6", "status": "active"},
    {"name": "Legacy API Migration", "description": "Migrating monolithic REST API to async FastAPI with proper layering", "color": "#f97316", "status": "archived"},
]

TAGS = [
    {"name": "backend", "color": "#6366f1"},
    {"name": "frontend", "color": "#ec4899"},
    {"name": "devops", "color": "#f59e0b"},
    {"name": "research", "color": "#14b8a6"},
    {"name": "urgent", "color": "#ef4444"},
    {"name": "refactor", "color": "#8b5cf6"},
    {"name": "docs", "color": "#10b981"},
    {"name": "testing", "color": "#f97316"},
    {"name": "python", "color": "#3b82f6"},
    {"name": "typescript", "color": "#06b6d4"},
    {"name": "docker", "color": "#0ea5e9"},
    {"name": "database", "color": "#a855f7"},
]

ACTIVITY_TEMPLATES = [
    # git commits
    {"type": "git_commit", "titles": [
        "feat: implement async session management for RAG pipeline",
        "fix: resolve CORS origin mismatch in production config",
        "refactor: extract embedding logic into standalone service",
        "feat: add pagination to activity list endpoint",
        "fix: correct JSON syntax error in favorites config",
        "chore: update dependencies to latest stable versions",
        "feat: add Framer Motion route transitions",
        "fix: mobile viewport overflow on chat page",
        "feat: implement FTS search across activities and projects",
        "docs: add architecture overview to README",
        "test: add pytest coverage for project service",
        "feat: wire onboarding form to /onboard endpoint",
        "refactor: split monolithic router into feature modules",
        "fix: handle cold start timeout on Render free tier",
        "feat: add streak calculation to dashboard stats",
    ]},
    # file edits
    {"type": "file_edit", "titles": [
        "Edited app/services/activity_service.py",
        "Updated tailwind.config.ts with custom color tokens",
        "Modified docker-compose.yml — added volume mounts",
        "Edited app/api/v1/router.py",
        "Updated components/ui/ActivityCard.tsx",
        "Modified app/core/config.py",
        "Edited frontend/src/app/dashboard/page.tsx",
        "Updated app/models/activity.py — added metadata field",
        "Edited README.md with deployment instructions",
        "Modified seed.py — added 200 more activity entries",
    ]},
    # terminal commands
    {"type": "terminal", "titles": [
        "docker compose up --build",
        "pytest tests/ -v --cov=app",
        "alembic upgrade head",
        "npm run build",
        "git rebase -i HEAD~5",
        "docker system prune -f",
        "pip install -r requirements.txt",
        "npx shadcn@latest add card",
        "psql -U postgres -d activity_logger",
        "uvicorn app.main:app --reload --port 8000",
    ]},
    # notes
    {"type": "note", "titles": [
        "Architecture decision: use FAISS over pgvector for local-first constraint",
        "Research: async SQLAlchemy patterns for high-concurrency endpoints",
        "Idea: add browser extension for automatic URL logging",
        "Meeting notes: sync with Rohit on RAG pipeline embedding strategy",
        "TODO list for this sprint — onboarding, history, CORS env var",
        "Reading summary: 'A Philosophy of Software Design' ch. 4-6",
        "Design decision: dark-first, acid green accent, Syne typeface",
        "Deployment notes: Render free tier cold start workaround",
        "Learning: SQLAlchemy selectinload vs joinedload tradeoffs",
        "Reflection: week retrospective — what shipped, what didn't",
    ]},
    # research
    {"type": "research", "titles": [
        "Compared embedding models: all-MiniLM vs. OpenAI text-embedding-3-small",
        "Evaluated Render vs. Fly.io for FastAPI free-tier deployment",
        "Researched SQLite WAL mode for concurrent read performance",
        "Studied LangGraph state machine patterns for RAG agents",
        "Reviewed HuggingFace tokenizer memory footprint benchmarks",
        "Analyzed Recharts vs. Victory for dashboard charting",
        "Read through FastAPI dependency injection internals",
        "Investigated FAISS index persistence across container restarts",
    ]},
    # features
    {"type": "feature", "titles": [
        "Implemented global search with FTS across all entities",
        "Built project timeline view with chronological feed",
        "Added activity type filter chips to timeline page",
        "Created dashboard with activity trend charts",
        "Implemented report generation — daily, weekly, monthly",
        "Added JSON and Markdown export endpoints",
        "Built responsive sidebar navigation with mobile drawer",
        "Implemented skeleton loaders on all data-fetching pages",
        "Added empty states with contextual CTAs",
        "Created tag management with color pickers",
    ]},
    # bug fixes
    {"type": "bug_fix", "titles": [
        "Fixed: activity count off-by-one in streak calculation",
        "Fixed: project cards overflowing on small screens",
        "Fixed: CORS blocking requests from Docker network",
        "Fixed: SQLite locking error under concurrent writes",
        "Fixed: date range filter ignoring timezone offset",
        "Fixed: search returning duplicate results across joins",
        "Fixed: report PDF export missing project section",
        "Fixed: Framer Motion layout shift on route change",
    ]},
    # deploys
    {"type": "deploy", "titles": [
        "Deployed backend to Render — v0.4.2",
        "Pushed Docker image to registry — sha256:a3f9...",
        "Released frontend to Vercel — production",
        "Applied database migration on staging environment",
        "Rolled back deploy — revert to v0.3.8",
        "Deployed with new CORS env var configuration",
    ]},
    # meetings
    {"type": "meeting", "titles": [
        "Sync with Humam — backend field schema for onboarding form",
        "Co-founder check-in — sprint priorities and blockers",
        "User interview — freelancer feedback on timeline UX",
        "Design review — finalized color system and typography scale",
        "Architecture discussion — embedding persistence strategy",
    ]},
]


def random_past_datetime(days_back: int = 90) -> datetime:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    delta = random.randint(0, days_back * 24 * 60)
    return now - timedelta(minutes=delta)


async def seed():
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        count_result = await db.execute(select(func.count()).select_from(Project))
        if count_result.scalar_one() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding tags...")
        tag_objects = []
        for t in TAGS:
            tag = Tag(id=str(uuid.uuid4()), name=t["name"], color=t["color"])
            db.add(tag)
            tag_objects.append(tag)
        await db.flush()

        print("Seeding projects...")
        project_objects = []
        for p in PROJECTS:
            proj = Project(
                id=str(uuid.uuid4()),
                name=p["name"],
                description=p["description"],
                color=p["color"],
                status=p["status"],
                created_at=random_past_datetime(180),
                updated_at=random_past_datetime(7),
            )
            db.add(proj)
            project_objects.append(proj)
        await db.flush()

        # Assign tags to projects
        for proj in project_objects:
            num_tags = random.randint(1, 4)
            selected_tags = random.sample(tag_objects, num_tags)
            for tag in selected_tags:
                pt = ProjectTag(project_id=proj.id, tag_id=tag.id)
                db.add(pt)
        await db.flush()

        print("Seeding activities...")
        activity_count = 0
        for template in ACTIVITY_TEMPLATES:
            act_type = template["type"]
            titles = template["titles"]
            # Generate multiple entries per template type
            repeats = random.randint(8, 20)
            for _ in range(repeats):
                title = random.choice(titles)
                proj = random.choice(project_objects[:6])  # Active projects only
                occurred_at = random_past_datetime(90)

                activity = Activity(
                    id=str(uuid.uuid4()),
                    project_id=proj.id,
                    type=act_type,
                    title=title,
                    source="manual" if act_type == "note" else "cli",
                    occurred_at=occurred_at,
                    created_at=occurred_at,
                )
                db.add(activity)
                await db.flush()

                # Tag some activities
                if random.random() > 0.5:
                    num_tags = random.randint(1, 2)
                    selected_tags = random.sample(tag_objects, num_tags)
                    for tag in selected_tags:
                        at = ActivityTag(activity_id=activity.id, tag_id=tag.id)
                        db.add(at)

                activity_count += 1

        # Extra recent activity so dashboard feels alive
        recent_templates = random.choices(ACTIVITY_TEMPLATES, k=30)
        for template in recent_templates:
            title = random.choice(template["titles"])
            proj = random.choice(project_objects[:5])
            hours_back = random.randint(0, 72)
            occurred_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=hours_back)
            activity = Activity(
                id=str(uuid.uuid4()),
                project_id=proj.id,
                type=template["type"],
                title=title,
                source="cli",
                occurred_at=occurred_at,
                created_at=occurred_at,
            )
            db.add(activity)
            activity_count += 1

        await db.commit()
        print(f"Seeded {len(project_objects)} projects, {len(tag_objects)} tags, {activity_count} activities.")


if __name__ == "__main__":
    asyncio.run(seed())

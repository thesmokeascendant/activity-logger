import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.database import Base, get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_create_project(client):
    response = await client.post("/api/v1/projects", json={
        "name": "Test Project",
        "description": "A test project",
        "color": "#6366f1",
        "status": "active",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_list_projects_empty(client):
    response = await client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_get_project_not_found(client):
    response = await client.get("/api/v1/projects/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_project(client):
    create_resp = await client.post("/api/v1/projects", json={
        "name": "Original Name",
        "color": "#6366f1",
        "status": "active",
    })
    project_id = create_resp.json()["id"]

    update_resp = await client.patch(f"/api/v1/projects/{project_id}", json={"name": "Updated Name"})
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_project(client):
    create_resp = await client.post("/api/v1/projects", json={
        "name": "To Delete",
        "color": "#6366f1",
        "status": "active",
    })
    project_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/v1/projects/{project_id}")
    assert delete_resp.status_code == 204

    get_resp = await client.get(f"/api/v1/projects/{project_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_create_activity(client):
    project_resp = await client.post("/api/v1/projects", json={
        "name": "Activity Project",
        "color": "#10b981",
        "status": "active",
    })
    project_id = project_resp.json()["id"]

    response = await client.post("/api/v1/activities", json={
        "type": "git_commit",
        "title": "feat: initial commit",
        "project_id": project_id,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "git_commit"
    assert data["title"] == "feat: initial commit"
    assert data["project"]["id"] == project_id


@pytest.mark.asyncio
async def test_list_activities_with_filter(client):
    await client.post("/api/v1/activities", json={"type": "note", "title": "A note"})
    await client.post("/api/v1/activities", json={"type": "git_commit", "title": "A commit"})

    response = await client.get("/api/v1/activities?type=note")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["type"] == "note"


@pytest.mark.asyncio
async def test_search(client):
    await client.post("/api/v1/activities", json={"type": "note", "title": "Unique searchable title xyz"})

    response = await client.get("/api/v1/search?q=xyz")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("xyz" in r["title"].lower() for r in data["results"])


@pytest.mark.asyncio
async def test_dashboard_stats(client):
    response = await client.get("/api/v1/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "today_count" in data
    assert "week_count" in data
    assert "active_projects" in data
    assert "daily_trend" in data


@pytest.mark.asyncio
async def test_create_tag(client):
    response = await client.post("/api/v1/tags", json={"name": "python", "color": "#3b82f6"})
    assert response.status_code == 201
    assert response.json()["name"] == "python"


@pytest.mark.asyncio
async def test_export_json(client):
    response = await client.get("/api/v1/export/json")
    assert response.status_code == 200
    data = response.json()
    assert "projects" in data
    assert "activities" in data
    assert "exported_at" in data

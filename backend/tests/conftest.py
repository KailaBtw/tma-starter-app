"""
Pytest configuration and fixtures for testing

This file sets up the test environment:
- Creates an in-memory test database (isolated from your real database)
- Provides fixtures for common test needs (client, users, auth headers)
- Overrides FastAPI dependencies to use test data instead of real ones

Fixtures defined here are automatically available to all test files.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from database import get_db
from models import Base, Role, User
from server import app

# Create test database (in-memory SQLite)
# ":memory:" means the database exists only in RAM - it's created fresh for
# each test run and disappears when tests finish. This keeps tests isolated
# and fast.
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    echo=False,  # Set to True if you want to see SQL queries in test output
)
# Create a session factory for the test database
TestSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


# Override the get_db dependency to use test database
# FastAPI uses dependency injection - when your routes call get_db(), FastAPI provides
# a database session. We're replacing that with our test database session.
async def override_get_db():
    """Override get_db to use test database instead of production database"""
    async with TestSessionLocal() as session:
        yield session  # Provide the test session to the route


# Apply the override globally
# This tells FastAPI: "Whenever a route needs get_db, use our test version instead"
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
async def test_db():
    """
    Create and drop test database tables for each test

    This fixture runs before each test function (scope="function"):
    1. Creates all database tables from your models
    2. Seeds required data (roles) that your app needs
    3. Yields control to the test
    4. Cleans up by dropping all tables after the test

    Other fixtures depend on this one (see client, admin_user below).
    """
    # Step 1: Create all tables (User, Role, Course, etc.) in the test database
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Step 2: Seed required roles that your app expects to exist
    # (Your User model requires a role_id, so roles must exist first)
    async with TestSessionLocal() as session:
        # Create all required roles
        roles = [
            Role(name="user", description="Standard user role"),
            Role(name="manager", description="Group manager role"),
            Role(name="admin", description="Administrator role"),
        ]
        for role in roles:
            session.add(role)
        await session.commit()

    # Step 3: Yield control to the test
    # Everything before yield runs before the test
    yield test_engine

    # Step 4: Cleanup - drop all tables after the test finishes
    # Everything after yield runs after the test (even if it fails)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(test_db):
    """
    Create HTTP client for making API requests in tests

    This fixture:
    - Depends on test_db (so the database is set up first)
    - Creates an AsyncClient that can make requests to your FastAPI app
    - Returns a client you can use like: response = await client.get("/users")

    Usage in tests:
        async def test_get_users(client):
            response = await client.get("/users")
            assert response.status_code == 200
    """
    from httpx import ASGITransport

    # Create an HTTP client that talks to your FastAPI app
    # ASGITransport allows httpx to communicate with FastAPI's ASGI interface
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac  # Provide the client to your test


@pytest.fixture
async def admin_user(test_db):
    """
    Create an admin user for testing

    This fixture:
    - Depends on test_db (so roles exist first)
    - Creates a test admin user in the database
    - Returns the user object with role relationship loaded

    Use this when you need an authenticated admin user in your tests.
    """
    async with TestSessionLocal() as session:
        from sqlalchemy.future import select
        from sqlalchemy.orm import joinedload

        # Get admin role (already created by test_db fixture)
        # We need to look it up because User requires a role_id foreign key
        result = await session.execute(select(Role).where(Role.name == "admin"))
        admin_role = result.scalar_one()

        # Create admin user with test data
        admin = User(
            username="admin",
            email="admin@test.com",
            # Dummy hash - we're not testing password hashing
            hashed_password="$2b$12$dummy",
            role_id=admin_role.id,  # Link to the admin role
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        await session.refresh(admin)  # Refresh to get the ID that was generated

        # Load the role relationship (so admin.role is available,
        # not just admin.role_id)
        # joinedload() eagerly loads the relationship in the same query
        result = await session.execute(
            select(User).where(User.id == admin.id).options(joinedload(User.role))
        )
        admin_with_role = result.scalar_one()

        yield admin_with_role  # Provide the user object to your test


@pytest.fixture
async def auth_headers(client, admin_user, test_db):
    """
    Get authentication headers for authenticated requests

    This fixture bypasses real authentication by overriding FastAPI dependencies.
    Instead of checking JWT tokens, it just returns the test admin_user.

    Usage in tests:
        async def test_create_course(client, auth_headers):
            response = await client.post(
                "/courses",
                json={"name": "Test Course"},
                headers=auth_headers  # Use this to authenticate
            )
            assert response.status_code == 201

    Why override dependencies?
    - Real auth requires JWT tokens, password hashing, etc.
    - In tests, we just want to verify endpoint behavior, not auth logic
    - Overriding lets us skip auth and focus on what we're testing
    """
    from auth import get_current_user, require_admin

    # Create override functions that return our test admin user
    # These replace the real auth functions that would check JWT tokens
    async def override_get_current_user():
        return admin_user  # Just return the test user, no token checking

    async def override_require_admin():
        return admin_user  # Just return the test admin, no permission checking

    # Apply the overrides: "When routes call get_current_user or require_admin,
    # use our test versions instead of the real ones"
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[require_admin] = override_require_admin

    # Return headers that look like a real auth request
    # (The actual token doesn't matter since we're overriding the auth functions)
    yield {"Authorization": "Bearer test-token"}

    # Clean up overrides after test to avoid affecting other tests
    # This is important! Without cleanup, overrides would persist across tests
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(require_admin, None)

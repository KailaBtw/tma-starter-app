"""
Pytest fixtures for testing the group schema
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload, sessionmaker

from models import Group, Role, User, UserGroup
from server import app


@pytest.fixture(scope="function")
async def seeded_db(test_db):
    TestSessionLocal = sessionmaker(
        test_db, class_=AsyncSession, expire_on_commit=False
    )

    # Seed required roles
    async with TestSessionLocal() as session:

        # Get admin role (already created by test_db fixture)
        result = await session.execute(select(Role).where(Role.name == "admin"))
        admin_role = result.scalar_one()

        # Create super admin
        sadmin = User(
            username="sadmin",
            email="sadmin@test.com",
            hashed_password="$2b$12$dummy",  # Dummy hash for testing
            role_id=admin_role.id,
            is_active=True,
        )
        session.add(sadmin)
        await session.commit()
        await session.refresh(sadmin)

        # Create all required groups
        groups = [
            Group(name="group_users", created_by=sadmin.id),
            Group(name="group_managers", created_by=sadmin.id),
            Group(name="group_admins", created_by=sadmin.id),
        ]
        for group in groups:
            session.add(group)
        await session.commit()

        yield session


@pytest.fixture
async def admin_user_g(seeded_db):
    """Create an admin user for testing (roles already exist from test_db fixture)"""
    session = seeded_db

    # Get admin role (already created by test_db fixture)
    result = await session.execute(select(Role).where(Role.name == "admin"))
    admin_role = result.scalar_one()

    # Create admin
    admin = User(
        username="admin",
        email="admin@test.com",
        hashed_password="$2b$12$dummy",  # Dummy hash for testing
        role_id=admin_role.id,
        is_active=True,
    )
    session.add(admin)
    await session.commit()
    await session.refresh(admin)

    # Get admin group
    result = await session.execute(select(Group).where(Group.name == "group_admins"))
    group = result.scalar_one()

    # Add admin to group
    membership = UserGroup(
        user_id=admin.id,
        group_id=group.id,
        role="member",
    )
    session.add(membership)
    await session.commit()

    # Load role relationship
    result = await session.execute(
        select(User).where(User.id == admin.id).options(joinedload(User.role))
    )
    admin_with_role = result.scalar_one()

    return admin_with_role


@pytest.fixture
async def admin_headers(client, admin_user_g, seeded_db):
    """Get authentication headers by overriding auth dependencies"""
    from auth import get_current_user, require_admin

    async def override_get_current_user():
        return admin_user_g

    async def override_require_admin():
        return admin_user_g

    # Override authentication dependencies to return our test admin user
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[require_admin] = override_require_admin

    yield {"Authorization": "Bearer test-token"}

    # Clean up overrides after test
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(require_admin, None)


@pytest.fixture
async def manager_user(seeded_db):
    """Create a manager user for testing (roles already exist from test_db fixture)"""
    session = seeded_db

    # Get manager role (already created by test_db fixture)
    result = await session.execute(select(Role).where(Role.name == "manager"))
    manager_role = result.scalar_one()

    # Create manager
    manager = User(
        username="manager",
        email="manager@test.com",
        hashed_password="$2b$12$dummy",  # Dummy hash for testing
        role_id=manager_role.id,
        is_active=True,
    )
    session.add(manager)
    await session.commit()
    await session.refresh(manager)

    # Get manager group
    result = await session.execute(select(Group).where(Group.name == "group_managers"))
    group = result.scalar_one()

    # Add manager to group
    membership = UserGroup(
        user_id=manager.id,
        group_id=group.id,
        role="member",
    )
    session.add(membership)
    await session.commit()

    # Load role relationship
    result = await session.execute(
        select(User).where(User.id == manager.id).options(joinedload(User.role))
    )
    manager_with_role = result.scalar_one()

    return manager_with_role


@pytest.fixture
async def manager_headers(client, manager_user, seeded_db):
    """Get authentication headers by overriding auth dependencies"""
    from auth import get_current_user, require_admin

    async def override_get_current_user():
        return manager_user

    async def override_require_admin():
        return manager_user

    # Override authentication dependencies to return our test manager user
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[require_admin] = override_require_admin

    yield {"Authorization": "Bearer test-token"}

    # Clean up overrides after test
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(require_admin, None)


@pytest.fixture
async def normal_user(seeded_db):
    """Create a normal user for testing (roles already exist from test_db fixture)"""
    session = seeded_db

    # Get user role (already created by test_db fixture)
    result = await session.execute(select(Role).where(Role.name == "user"))
    user_role = result.scalar_one()

    # Create user
    user = User(
        username="user",
        email="user@test.com",
        hashed_password="$2b$12$dummy",  # Dummy hash for testing
        role_id=user_role.id,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    # Get user group
    result = await session.execute(select(Group).where(Group.name == "group_users"))
    group = result.scalar_one()

    # Add user to group
    membership = UserGroup(
        user_id=user.id,
        group_id=group.id,
        role="member",
    )
    session.add(membership)
    await session.commit()

    # Load role relationship
    result = await session.execute(
        select(User).where(User.id == user.id).options(joinedload(User.role))
    )
    user_with_role = result.scalar_one()

    return user_with_role


@pytest.fixture
async def user_headers(client, normal_user, seeded_db):
    """Get authentication headers by overriding auth dependencies"""
    from auth import get_current_user

    async def override_get_current_user():
        return normal_user

    # Override authentication dependencies to return our test normal user
    app.dependency_overrides[get_current_user] = override_get_current_user

    yield {"Authorization": "Bearer test-token"}

    # Clean up overrides after test
    app.dependency_overrides.pop(get_current_user, None)

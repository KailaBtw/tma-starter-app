"""
Contract-level tests for the /api/groups endpoint
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.future import select

from models import Group, User

pytest_plugins = ["tests.test_groups_helper"]


# Route: /api/groups
# Request: GET
# Response: List[GroupResponse]
@pytest.mark.asyncio
async def test_get_all_groups_admin(client: AsyncClient, admin_headers, seeded_db):
    response = await client.get("/api/groups", headers=admin_headers)
    assert response.status_code == 200

    # Make sure the response fulfills the API contract
    groups = response.json()

    for group in groups:
        assert "name" in group
        assert "id" in group
        assert "created_by" in group
        assert "created_at" in group
        assert "updated_at" in group

    # Make sure the request actually works
    group_names = [group["name"] for group in groups]
    assert "group_users" in group_names
    assert "group_managers" in group_names
    assert "group_admins" in group_names


@pytest.mark.asyncio
async def test_get_all_groups_manager(client: AsyncClient, manager_headers, seeded_db):
    response = await client.get("/api/groups", headers=manager_headers)
    assert response.status_code == 200

    groups = response.json()
    group_names = [group["name"] for group in groups]
    assert "group_users" in group_names
    assert "group_managers" in group_names
    assert "group_admins" in group_names


@pytest.mark.asyncio
async def test_get_all_groups_user(client: AsyncClient, user_headers, seeded_db):
    response = await client.get("/api/groups", headers=user_headers)
    assert response.status_code == 200

    groups = response.json()
    group_names = [group["name"] for group in groups]
    assert "group_users" in group_names
    assert "group_managers" not in group_names
    assert "group_admins" not in group_names


@pytest.mark.asyncio
async def test_get_all_groups_requires_auth(client: AsyncClient, seeded_db):
    response = await client.get("/api/groups")
    assert response.status_code == 401


# Route: /api/groups/{id}
# Request: GET
# Response: GroupDetailResponse
@pytest.mark.asyncio
async def test_get_group_by_id_admin(client: AsyncClient, admin_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_admins"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.get(f"/api/groups/{group_id}", headers=admin_headers)
    assert response.status_code == 200

    # Make sure the response fulfills the API contract
    group = response.json()
    assert "name" in group
    assert "id" in group
    assert "created_by" in group
    assert "created_at" in group
    assert "updated_at" in group
    assert "members" in group

    # Make sure the request actually works
    assert group["id"] == group_id
    # assert any(member["username"] == "admin" for member in group["members"])


@pytest.mark.asyncio
async def test_get_group_by_id_admin_access(
    client: AsyncClient, admin_headers, seeded_db, normal_user
):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_users"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.get(f"/api/groups/{group_id}", headers=admin_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["id"] == group_id
    assert any(member["username"] == "user" for member in group["members"])


@pytest.mark.asyncio
async def test_get_group_by_id_manager(client: AsyncClient, manager_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_managers"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.get(f"/api/groups/{group_id}", headers=manager_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["id"] == group_id
    assert any(member["username"] == "manager" for member in group["members"])


@pytest.mark.asyncio
async def test_get_group_by_id_manager_access(
    client: AsyncClient, manager_headers, seeded_db, normal_user
):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_users"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.get(f"/api/groups/{group_id}", headers=manager_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["id"] == group_id
    assert any(member["username"] == "user" for member in group["members"])


@pytest.mark.asyncio
async def test_get_group_by_id_user(client: AsyncClient, user_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_users"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.get(f"/api/groups/{group_id}", headers=user_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["id"] == group_id
    assert any(member["username"] == "user" for member in group["members"])


@pytest.mark.asyncio
async def test_get_group_by_id_requires_auth(client: AsyncClient, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_users"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.get(f"/api/groups/{group_id}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_group_id_insufficient_permission(
    client: AsyncClient, user_headers, seeded_db
):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_admins"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.get(f"/api/groups/{group_id}", headers=user_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_group_id_not_found(client: AsyncClient, admin_headers, seeded_db):
    group_id = -1
    response = await client.get(f"/api/groups/{group_id}", headers=admin_headers)
    assert response.status_code == 404


# Route: /api/groups
# Request: POST
# Response: GroupResponse
@pytest.mark.asyncio
async def test_create_group_admin(client: AsyncClient, admin_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(User).where(User.username == "admin"))
    creator = result.scalar_one()
    creator_id = creator.id

    group_data = {
        "name": "group_admin_test",
        "description": "this is a test admin group",
        "created_by": creator_id,
    }
    response = await client.post("/api/groups", json=group_data, headers=admin_headers)
    assert response.status_code == 201

    # Make sure the response fulfills the API contract
    group = response.json()
    assert "name" in group
    assert group["name"] == "group_admin_test"
    assert "description" in group
    assert group["description"] == "this is a test admin group"
    assert "id" in group
    assert "created_by" in group
    assert "created_at" in group
    assert "updated_at" in group

    # Make sure the request actually works
    group_id = group["id"]
    response = await client.get(f"/api/groups/{group_id}", headers=admin_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["name"] == "group_admin_test"
    assert group["description"] == "this is a test admin group"


@pytest.mark.asyncio
async def test_create_group_manager(client: AsyncClient, manager_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(User).where(User.username == "manager"))
    creator = result.scalar_one()
    creator_id = creator.id

    group_data = {
        "name": "group_manager_test",
        "description": "this is a test manager group",
        "created_by": creator_id,
    }
    response = await client.post(
        "/api/groups", json=group_data, headers=manager_headers
    )
    assert response.status_code == 201

    group = response.json()
    group_id = group["id"]
    response = await client.get(f"/api/groups/{group_id}", headers=manager_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["name"] == "group_manager_test"
    assert group["description"] == "this is a test manager group"


@pytest.mark.asyncio
async def test_create_group_empty_name(client: AsyncClient, admin_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(User).where(User.username == "admin"))
    creator = result.scalar_one()
    creator_id = creator.id

    group_data = {
        "name": " ",
        "description": "this is a test group whose name is just whitespace!",
        "created_by": creator_id,
    }
    response = await client.post("/api/groups", json=group_data, headers=admin_headers)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_group_requires_auth(client: AsyncClient, seeded_db):
    group_data = {}
    response = await client.post("/api/groups", json=group_data)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_group_insufficient_permission(
    client: AsyncClient, user_headers, seeded_db
):
    session = seeded_db

    result = await session.execute(select(User).where(User.username == "user"))
    creator = result.scalar_one()
    creator_id = creator.id

    group_data = {
        "name": "group_user_test",
        "description": "this is a test user group",
        "created_by": creator_id,
    }
    response = await client.post("/api/groups", json=group_data, headers=user_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_group_invalid_input(
    client: AsyncClient, admin_headers, seeded_db
):
    group_data = {}
    response = await client.post("/api/groups", json=group_data, headers=admin_headers)
    assert response.status_code == 422


# Route: /api/groups/{id}
# Request: PATCH
# Response: GroupResponse
@pytest.mark.asyncio
async def test_update_group_admin(client: AsyncClient, admin_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_admins"))
    group = result.scalar_one()
    group_id = group.id

    group_data = {
        "name": "group_admin_updated",
        "description": "this is an updated admin group",
    }
    response = await client.patch(
        f"/api/groups/{group_id}", json=group_data, headers=admin_headers
    )
    assert response.status_code == 200

    # Make sure the response fulfills the API contract
    group = response.json()
    assert "name" in group
    assert group["name"] == "group_admin_updated"
    assert "description" in group
    assert group["description"] == "this is an updated admin group"
    assert "id" in group
    assert "created_by" in group
    assert "created_at" in group
    assert "updated_at" in group

    # Make sure the request actually works
    response = await client.get(f"/api/groups/{group_id}", headers=admin_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["name"] == "group_admin_updated"
    assert group["description"] == "this is an updated admin group"


@pytest.mark.asyncio
async def test_update_group_manager(client: AsyncClient, manager_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_managers"))
    group = result.scalar_one()
    group_id = group.id

    group_data = {
        "name": "group_manager_updated",
        "description": "this is an updated manager group",
    }
    response = await client.patch(
        f"/api/groups/{group_id}", json=group_data, headers=manager_headers
    )
    assert response.status_code == 200

    response = await client.get(f"/api/groups/{group_id}", headers=manager_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["name"] == "group_manager_updated"
    assert group["description"] == "this is an updated manager group"


@pytest.mark.asyncio
async def test_update_group_whitespace_error(
    client: AsyncClient, admin_headers, seeded_db
):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_admins"))
    group = result.scalar_one()
    group_id = group.id

    group_data = {
        "name": " ",
        "description": "this is an updated group whose name is just whitespace!",
    }
    response = await client.patch(
        f"/api/groups/{group_id}", json=group_data, headers=admin_headers
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_group_requires_auth(client: AsyncClient, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_users"))
    group = result.scalar_one()
    group_id = group.id

    group_data = {
        "name": "group_user_updated",
        "description": "this is an updated user group",
    }
    response = await client.patch(f"/api/groups/{group_id}", json=group_data)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_group_insufficient_permission(
    client: AsyncClient, user_headers, seeded_db
):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_users"))
    group = result.scalar_one()
    group_id = group.id

    group_data = {
        "name": "group_user_updated",
        "description": "this is an updated user group",
    }
    response = await client.patch(
        f"/api/groups/{group_id}", json=group_data, headers=user_headers
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_group_id_not_found(client: AsyncClient, admin_headers, seeded_db):
    group_id = -1
    group_data = {
        "name": "group_secret_updated",
        "description": "this is an updated secret group",
    }
    response = await client.patch(
        f"/api/groups/{group_id}", json=group_data, headers=admin_headers
    )
    assert response.status_code == 404


# Route: /api/groups/{id}
# Request: DELETE
# Response: None
@pytest.mark.asyncio
async def test_delete_group_admin(client: AsyncClient, admin_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_admins"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.delete(f"/api/groups/{group_id}", headers=admin_headers)
    assert response.status_code == 204

    # Make sure the response fulfills the API contract
    assert not response.content

    # Make sure the request actually works
    response = await client.get(f"/api/groups/{group_id}", headers=admin_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_group_manager(client: AsyncClient, manager_headers, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_managers"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.delete(f"/api/groups/{group_id}", headers=manager_headers)
    assert response.status_code == 204

    response = await client.get(f"/api/groups/{group_id}", headers=manager_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_group_requires_auth(client: AsyncClient, seeded_db):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_users"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.delete(f"/api/groups/{group_id}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_group_insufficient_permission(
    client: AsyncClient, user_headers, seeded_db
):
    session = seeded_db

    result = await session.execute(select(Group).where(Group.name == "group_users"))
    group = result.scalar_one()
    group_id = group.id

    response = await client.delete(f"/api/groups/{group_id}", headers=user_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_group_id_not_found(client: AsyncClient, admin_headers, seeded_db):
    group_id = -1
    response = await client.delete(f"/api/groups/{group_id}", headers=admin_headers)
    assert response.status_code == 404

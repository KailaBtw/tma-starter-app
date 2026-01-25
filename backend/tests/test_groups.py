"""
Contract-level tests for the /api/groups endpoint
"""

import pytest
from httpx import AsyncClient

# Route: /api/groups
# Request: GET
# Response: List[GroupResponse]
@pytest.mark.asyncio
async def test_get_all_groups_admin(client: AsyncClient, admin_headers):
    response = await client.get("/api/groups", headers = admin_headers)
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
async def test_get_all_groups_manager(client: AsyncClient, manager_headers):
    response = await client.get("/api/groups", headers = manager_headers)
    assert response.status_code == 200

    groups = response.json()
    group_names = [group["name"] for group in groups]
    assert "group_users" in group_names
    assert "group_managers" in group_names
    assert "group_admins" in group_names

@pytest.mark.asyncio
async def test_get_all_groups_user(client: AsyncClient, user_headers):
    response = await client.get("/api/groups", headers = user_headers)
    assert response.status_code == 200

    groups = response.json()
    group_names = [group["name"] for group in groups]
    assert "group_users" in group_names
    assert "group_managers" not in group_names
    assert "group_admins" not in group_names

@pytest.mark.asyncio
async def test_get_all_groups_requires_auth(client: AsyncClient):
    response = await client.get("/api/groups")
    assert response.status_code == 401


# Route: /api/groups/{id}
# Request: GET
# Response: GroupDetailResponse
@pytest.mark.asyncio
async def test_get_group_by_id_admin(client: AsyncClient, admin_headers):
    group_id = 3
    response = await client.get(f"/api/groups/{group_id}", headers = admin_headers)
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
    assert group["id"] == 3
    assert "test_admin" in group["members"]

@pytest.mark.asyncio
async def test_get_group_by_id_admin_access(client: AsyncClient, admin_headers):
    group_id = 1
    response = await client.get(f"/api/groups/{group_id}", headers = admin_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["id"] == 1
    assert "test_user" in group["members"]

@pytest.mark.asyncio
async def test_get_group_by_id_manager(client: AsyncClient, manager_headers):
    group_id = 2
    response = await client.get(f"/api/groups/{group_id}", headers = manager_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["id"] == 2
    assert "test_manager" in group["members"]

@pytest.mark.asyncio
async def test_get_group_by_id_manager_access(client: AsyncClient, manager_headers):
    group_id = 1
    response = await client.get(f"/api/groups/{group_id}", headers = manager_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["id"] == 1
    assert "test_user" in group["members"]

@pytest.mark.asyncio
async def test_get_group_by_id_user(client: AsyncClient, user_headers):
    group_id = 1
    response = await client.get(f"/api/groups/{group_id}", headers = user_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["id"] == 1
    assert "test_user" in group["members"]

@pytest.mark.asyncio
async def test_get_group_by_id_requires_auth(client: AsyncClient):
    group_id = 1
    response = await client.get(f"/api/groups/{group_id}")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_group_id_insufficient_permission(client: AsyncClient, user_headers):
    group_id = 3
    response = await client.get(f"/api/groups/{group_id}", headers = user_headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_group_id_not_found(client: AsyncClient, admin_headers):
    group_id = -1
    response = await client.get(f"/api/groups/{group_id}", headers = admin_headers)
    assert response.status_code == 404


# Route: /api/groups
# Request: POST
# Response: GroupResponse
@pytest.mark.asyncio
async def test_create_group_admin(client: AsyncClient, admin_headers):
    group_data = { "name": "group_admin_test", "description": "this is a test admin group" }
    response = await client.post("/api/groups", json = group_data, headers = admin_headers)
    assert response.status_code == 201

    # Make sure the response fulfills the API contract
    group = response.json()
    assert "name" in group
    assert group["name"] == "group_test"
    assert "description" in group
    assert group["description"] == "this is a test group"
    assert "id" in group
    assert "created_by" in group
    assert "created_at" in group
    assert "updated_at" in group

    # Make sure the request actually works
    group_id = group["id"]
    response = await client.get(f"/api/groups/{group_id}", headers = admin_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["name"] == "group_admin_test"
    assert group["description"] == "this is a test admin group"

@pytest.mark.asyncio
async def test_create_group_manager(client: AsyncClient, manager_headers):
    group_data = { "name": "group_manager_test", "description": "this is a test manager group" }
    response = await client.post("/api/groups", json = group_data, headers = manager_headers)
    assert response.status_code == 201

    group = response.json()
    group_id = group["id"]
    response = await client.get(f"/api/groups/{group_id}", headers = manager_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["name"] == "group_manager_test"
    assert group["description"] == "this is a test manager group"

@pytest.mark.asyncio
async def test_create_group_invalid_input(client: AsyncClient, headers = admin_headers):
    group_data = {}
    response = await client.post("/api/groups", json = group_data, headers = admin_headers)
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_create_group_requires_auth(client: AsyncClient):
    group_data = { "name": "group_user_test", "description": "this is a test user group" }
    response = await client.post("/api/groups", json = group_data)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_create_group_insufficient_permission(client: AsyncClient, user_headers):
    group_data = { "name": "group_user_test", "description": "this is a test user group" }
    response = await client.post("/api/groups", json = group_data, headers = user_headers)
    assert response.status_code == 403


# Route: /api/groups/{id}
# Request: PATCH
# Response: GroupResponse
@pytest.mark.asyncio
async def test_update_group_admin(client: AsyncClient, admin_headers):
    group_id = 3
    group_data = { "name": "group_admin_updated", "description": "this is an updated admin group" }
    response = await client.patch(f"/api/groups/{group_id}", json = group_data, headers = admin_headers)
    assert response.status_code == 201

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
    response = await client.get(f"/api/groups/{group_id}", headers = admin_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["name"] == "group_admin_updated"
    assert group["description"] = "this is an updated admin group"

@pytest.mark.asyncio
async def test_update_group_manager(client: AsyncClient, manager_headers):
    group_id = 2
    group_data = { "name": "group_manager_updated", "description": "this is an updated manager group" }
    response = await client.patch(f"/api/groups/{group_id}", json = group_data, headers = manager_headers)
    assert response.status_code == 201

    response = await client.get(f"/api/groups/{group_id}", headers = manager_headers)
    assert response.status_code == 200

    group = response.json()
    assert group["name"] == "group_manager_updated"
    assert group["description"] == "this is an updated manager group"

@pytest.mark.asyncio
async def test_update_group_invalid_input(client: AsyncClient, admin_headers):
    group_id = 1
    group_data = {}
    response = await client.patch(f"/api/groups/{group_id}", json = group_data, headers = admin_headers)
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_update_group_requires_auth(client: AsyncClient):
    group_id = 1
    group_data = { "name": "group_user_updated", "description": "this is an updated test group" }
    response = await client.patch(f"/api/groups/{group_id}", json = group_data)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_update_group_insufficient_permission(client: AsyncClient, user_headers):
    group_id = 1
    group_data = { "name": "group_user_updated", "description": "this is an updated test group" }
    response = await client.patch(f"/api/groups/{group_id}", json = group_data, headers = user_headers)
    assert response.status_code == 403


# Route: /api/groups/{id}
# Request: DELETE
# Response: None
@pytest.mark.asyncio
async def test_delete_group_admin(client: AsyncClient, admin_headers):
    group_id = 3
    response = await client.delete(f"/api/groups/{group_id}", headers = admin_headers)
    assert response.status_code == 204

    # Make sure the response fulfills the API contract
    assert response.json() is None

    # Make sure the request actually works
    response = await client.get(f"/api/groups/{group_id}", headers = admin_headers)
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_group_manager(client: AsyncClient, manager_headers):
    group_id = 2
    response = await client.delete(f"/api/groups/{group_id}", headers = manager_headers)
    assert response.status_code == 204

    response = await client.get(f"/api/groups/{group_id}", headers = manager_headers)
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_group_requires_auth(client: AsyncClient):
    group_id = 1
    response = await client.delete(f"/api/groups/{group_id}")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_delete_group_insufficient_permission(client: AsyncClient, user_headers):
    group_id = 1
    response = await client.delete(f"/api/groups/{group_id}", headers = user_headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_delete_group_not_found(client: AsyncClient, admin_headers):
    group_id = -1
    response = await client.delete(f"/api/groups/{group_id}", headers = admin_headers)
    assert response.status_code == 404
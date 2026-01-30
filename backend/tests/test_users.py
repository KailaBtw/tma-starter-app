"""
Contract-level tests for the /api/users endpoint
"""

import pytest
from httpx import AsyncClient

from models import Base, Role, User


# List all users (DONE)
# Route: /api/users
# Request: GET
@pytest.mark.asyncio
async def test_get_all_users_requires_auth(client: AsyncClient):
    """Test that GET /api/users requires authentication"""
    response = await client.get("/api/users")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_all_users_with_auth(client: AsyncClient, auth_headers, admin_user):
    """Test that GET /api/users returns list of users when authenticated"""
    response = await client.get("/api/users", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    # Verify the list contains at least the admin user we created
    assert len(data) >= 1
    # Verify each item in the list has the expected user structure
    for user in data:
        assert "id" in user
        assert "username" in user
        assert "email" in user
        assert "role" in user
        assert "password" not in user  # Password should never be in response

    # Verify the admin user is in the list
    admin_usernames = [user["username"] for user in data]
    assert "admin" in admin_usernames


# Get a single user
# Route: /api/users/{id}
# Request: GET
@pytest.mark.asyncio
async def test_get_user_by_id_requires_auth(client: AsyncClient):
    """Test that GET /api/users/{id} requires authentication"""
    response = await client.get("/api/users/1")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_user_by_id_with_auth(client: AsyncClient, auth_headers, admin_user):
    """Test that GET /api/users/{id} returns a user when authenticated"""
    response = await client.get("/api/users/1", headers=auth_headers)
    data = response.json()
    assert response.status_code == 200

    #  What else needs to be added here?
    assert "id" in data
    assert "username" in data
    assert "email" in data
    assert "role" in data
    assert "password" not in data  # Password should never be in response

    # Verify the admin user is in the list

    assert data["username"] == "admin"


@pytest.mark.asyncio
async def test_get_user_by_id_not_found(client: AsyncClient, auth_headers):
    """Test that GET /api/users/{id} returns 404 for non-existent user"""
    response = await client.get("/api/users/99999", headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


# Create a new user (admin only) (DONE)
# Route: /api/users/{id}
# Request: POST
@pytest.mark.asyncio
async def test_create_user_requires_auth(client: AsyncClient):
    """Test that POST /api/users requires authentication"""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
    }
    response = await client.post("/api/users", json=user_data)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_user_success(client: AsyncClient, auth_headers, test_db):
    """Test that POST /api/users creates a user successfully"""
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123",
        "role": "user",
    }
    response = await client.post("/api/users", json=user_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "password" not in data  # Password should not be in response

    # Verify the user was actually created by retrieving it through the API
    user_id = data["id"]
    get_response = await client.get(f"/api/users/{user_id}", headers=auth_headers)
    assert get_response.status_code == 200
    retrieved_user = get_response.json()
    assert retrieved_user["username"] == "newuser"
    assert retrieved_user["email"] == "newuser@example.com"


@pytest.mark.asyncio
async def test_create_user_missing_fields(client: AsyncClient, auth_headers):
    """Test that POST /api/users returns 422 for missing required fields"""
    user_data = {
        "username": "testuser"
        # Missing email and password
    }
    response = await client.post("/api/users", json=user_data, headers=auth_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_user_duplicate_username(
    client: AsyncClient, auth_headers, test_db
):
    """Test that POST /api/users returns error for duplicate username"""
    user_data = {
        "username": "duplicate",
        "email": "first@example.com",
        "password": "password123",
        "role": "user",
    }
    # Create first user
    create_response = await client.post(
        "/api/users", json=user_data, headers=auth_headers
    )
    assert create_response.status_code == 201
    first_user_id = create_response.json()["id"]

    # Verify the first user was actually created
    get_response = await client.get(f"/api/users/{first_user_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["username"] == "duplicate"

    # Try to create duplicate username (different email)
    user_data["email"] = "second@example.com"
    response = await client.post("/api/users", json=user_data, headers=auth_headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

    # Verify the first user still exists and wasn't affected
    get_response = await client.get(f"/api/users/{first_user_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert (
        get_response.json()["email"] == "first@example.com"
    )  # Original email unchanged


# Update user
# Route: /api/users/{id}
# Request: PATCH
@pytest.mark.asyncio
async def test_update_user(client: AsyncClient, auth_headers):
    # Update the user
    user_data = {
        "first_name": "walter",
        "last_name": "smith",
        "child_name": "walter jr",
        "child_sex_assigned_at_birth": "male",
        "child_dob": "2024-01-30",
        "avatar_url": "spongebob.jpg",
    }

    id = 1
    response = await client.patch(
        f"/api/users/{id}", json=user_data, headers=auth_headers
    )
    data = response.json()
    assert response.status_code == 200

    assert data["first_name"] == "walter"
    assert data["last_name"] == "smith"
    assert data["child_name"] == "walter jr"
    assert data["child_sex_assigned_at_birth"] == "male"
    assert data["child_dob"] == "2024-01-30"
    assert data["avatar_url"] == "spongebob.jpg"

    # Verify the update persisted by retrieving the user
    get_response = await client.get(f"/api/users/{id}", headers=auth_headers)
    assert get_response.status_code == 200
    data = response.json()
    assert data["first_name"] == "walter"
    assert data["last_name"] == "smith"
    assert data["child_name"] == "walter jr"
    assert data["child_sex_assigned_at_birth"] == "male"
    assert data["child_dob"] == "2024-01-30"
    assert data["avatar_url"] == "spongebob.jpg"


@pytest.mark.asyncio
async def test_update_user_id_not_found(client: AsyncClient, auth_headers):
    response = await client.patch("/api/users/99999", json={}, headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


# Delete user
# Route: /api/users/{id}
# Request: DELETE
@pytest.mark.asyncio
async def test_delete_user_self_not_allowed(client: AsyncClient, auth_headers):
    response = await client.delete(f"/api/users/1", headers=auth_headers)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_user_id_not_found(client: AsyncClient, auth_headers):
    response = await client.delete("/api/users/99999", headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_delete_regular_user_success(client: AsyncClient, auth_headers):
    # Create dummy user
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123",
        "role": "user",
    }
    response = await client.post("/api/users", json=user_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    id = data["id"]  # generate an id
    # get the new user
    get_response = await client.get(f"/api/users/{id}", headers=auth_headers)
    assert get_response.status_code == 200

    # now delete the new user
    delete_response = await client.delete(f"/api/users/{id}", headers=auth_headers)
    assert delete_response.status_code == 204

    # check to make sure user was deleted
    secondget_response = await client.get(f"/api/users/{id}", headers=auth_headers)
    assert secondget_response.status_code == 404


# Update user status
# Route: /api/users/{id}/status
# Request: PATCH
@pytest.mark.asyncio
async def test_user_status_success(client: AsyncClient, auth_headers):
    # Create dummy user
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123",
        "role": "user",
        "is_active": False,
    }
    response = await client.post("/api/users", json=user_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    id = data["id"]  # generate an id
    # get the new user
    get_response = await client.get(f"/api/users/{id}", headers=auth_headers)
    assert get_response.status_code == 200

    # change the status
    payload = {"user_id": 0, "is_active": True}
    response = await client.patch(
        f"/api/users/{id}/status", json=payload, headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    # assert that the role has changed
    assert data["is_active"] is True

    get_response2 = await client.get(f"/api/users/{id}", headers=auth_headers)
    assert get_response2.status_code == 200
    data = get_response2.json()
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_update_user_status_id_not_found(client: AsyncClient, auth_headers):
    response = await client.patch("/api/users/99999", json={}, headers=auth_headers)
    assert response.status_code == 404


# Update user role
# Route: /api/users/{id}/role
# Request: PATCH
@pytest.mark.asyncio
async def test_update_user_role_id_not_found(client: AsyncClient, auth_headers):
    response = await client.patch("/api/users/99999", json={}, headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_user_role_success(client: AsyncClient, auth_headers):
    # Create dummy user
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123",
        "role": "user",
    }
    response = await client.post("/api/users", json=user_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    id = data["id"]  # generate an id
    # get the new user
    get_response = await client.get(f"/api/users/{id}", headers=auth_headers)
    assert get_response.status_code == 200

    # change the role
    payload = {"user_id": id, "role": "manager"}
    response = await client.patch(
        f"/api/users/{id}/role", json=payload, headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    # assert that the role has changed
    assert data["role"]["name"] == "manager"

    get_response2 = await client.get(f"/api/users/{id}", headers=auth_headers)
    assert get_response2.status_code == 200
    data = get_response2.json()
    assert data["role"]["name"] == "manager"

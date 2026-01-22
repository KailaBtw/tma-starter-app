"""
Contract-level tests for the /api/users endpoint
"""

import pytest
from httpx import AsyncClient

# List all users (DONE)
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
@pytest.mark.asyncio
async def test_get_user_by_id_requires_auth(client: AsyncClient):
    """Test that GET /api/users/{id} requires authentication"""
    response = await client.get("/api/users/1")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_user_by_id_with_auth(client: AsyncClient, auth_headers, admin_user):
    # """Test that GET /api/users/{id} returns list of users when authenticated"""
     response = await client.get("/api/users/{id}", headers=auth_headers)


@pytest.mark.asyncio
async def test_get_user_by_id_not_found(client: AsyncClient, auth_headers):
    """Test that GET /api/users/{id} returns 404 for non-existent user"""
    response = await client.get("/api/users/99999", headers=auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()

# Create a new user (DONE)
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

# Delete user

# Update user status

# Update user role
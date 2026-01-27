"""
Contract-level tests for the /api/users endpoint

These tests verify the API contract (behavior) from the client's perspective:
- Status codes (200, 201, 404, 401, 422, etc.)
- Response structure (JSON format, required fields)
- Error messages (when things go wrong)
- Authentication/Authorization (who can access what)

They do NOT test implementation details - they test the API contract.

Fixtures used (from tests/conftest.py):
- client: AsyncClient for making HTTP requests to the API
- auth_headers: Authentication headers (simulates logged-in admin user)
- test_db: Test database (in-memory SQLite, created fresh for each test)
- admin_user: Admin user fixture (created in test database)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_all_users_requires_auth(client: AsyncClient):
    """
    Test that GET /api/users requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    This is a security requirement - users endpoint should be protected.
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/users")

    # Assert: Should return 401 (Unauthorized)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_all_users_with_auth(client: AsyncClient, auth_headers, admin_user):
    """
    Test that GET /api/users returns list of users when authenticated

    Contract: Authenticated admin users can retrieve all users
    - Status: 200 OK
    - Response: List of user objects
    - Each user should have: id, username, email, role
    - Password should NEVER be in response (security)
    """
    # Act: Make authenticated request
    response = await client.get("/api/users", headers=auth_headers)

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should be a list
    data = response.json()
    assert isinstance(data, list)

    # Assert: List should contain at least the admin user
    # (created by admin_user fixture)
    assert len(data) >= 1

    # Assert: Each user in the list should have the expected structure
    # This verifies the response schema matches what the API contract promises
    for user in data:
        assert "id" in user
        assert "username" in user
        assert "email" in user
        assert "role" in user
        assert "password" not in user  # Security: Password should never be in response

    # Assert: The admin user (from fixture) should be in the list
    admin_usernames = [user["username"] for user in data]
    assert "admin" in admin_usernames


@pytest.mark.asyncio
async def test_get_user_by_id_requires_auth(client: AsyncClient):
    """
    Test that GET /api/users/{id} requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    Even with a valid user ID, authentication is required.
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/users/1")

    # Assert: Should return 401 (Unauthorized)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_user_by_id_not_found(client: AsyncClient, auth_headers):
    """
    Test that GET /api/users/{id} returns 404 for non-existent user

    Contract: When requesting a user that doesn't exist:
    - Status: 404 Not Found
    - Response: Error message indicating user not found
    """
    # Act: Request a user ID that doesn't exist
    response = await client.get("/api/users/99999", headers=auth_headers)

    # Assert: Should return 404 Not Found
    assert response.status_code == 404

    # Assert: Error message should indicate user not found
    data = response.json()
    assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_create_user_requires_auth(client: AsyncClient):
    """
    Test that POST /api/users requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    Creating users requires admin privileges, so authentication is mandatory.
    """
    # Arrange: Prepare user data (valid format)
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
    }

    # Act: Make request without authentication headers
    response = await client.post("/api/users", json=user_data)

    # Assert: Should return 401 (Unauthorized) even with valid data
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_user_success(client: AsyncClient, auth_headers, test_db):
    """
    Test that POST /api/users creates a user successfully

    Contract: When creating a user with valid data:
    - Status: 201 Created
    - Response: User object with id, username, email, role
    - Password should NOT be in response (security)
    - User should be retrievable via GET /api/users/{id}

    Note: test_db fixture ensures fresh database for each test
    """
    # Arrange: Prepare valid user data
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123",
        "role": "user",
    }

    # Act: Create user with authenticated request
    response = await client.post("/api/users", json=user_data, headers=auth_headers)

    # Assert: Should return 201 Created
    assert response.status_code == 201

    # Assert: Response should contain the created user data
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "id" in data  # User should have an ID assigned
    assert "password" not in data  # Security: Password should never be in response

    # Assert: User should be retrievable (verifies it was actually created in database)
    # This is a "round-trip" test - create then retrieve to verify persistence
    user_id = data["id"]
    get_response = await client.get(f"/api/users/{user_id}", headers=auth_headers)
    assert get_response.status_code == 200
    retrieved_user = get_response.json()
    assert retrieved_user["username"] == "newuser"
    assert retrieved_user["email"] == "newuser@example.com"


@pytest.mark.asyncio
async def test_create_user_missing_fields(client: AsyncClient, auth_headers):
    """
    Test that POST /api/users returns 422 for missing required fields

    Contract: When creating a user with missing required fields:
    - Status: 422 Unprocessable Entity (validation error)
    - This tests input validation - the API should reject invalid data

    Note: Even with authentication, invalid data should be rejected
    """
    # Arrange: Prepare user data with missing required fields (email and password)
    user_data = {
        "username": "testuser"
        # Missing email and password - these are required fields
    }

    # Act: Try to create user with incomplete data
    response = await client.post("/api/users", json=user_data, headers=auth_headers)

    # Assert: Should return 422 (validation error)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_user_duplicate_username(
    client: AsyncClient, auth_headers, test_db
):
    """
    Test that POST /api/users returns error for duplicate username

    Contract: When trying to create a user with a username that already exists:
    - Status: 400 Bad Request (or similar error status)
    - Error message should indicate username already exists
    - Original user should remain unchanged

    This tests uniqueness constraints and ensures the API prevents duplicate usernames.
    """
    # Arrange: Prepare user data for first user
    user_data = {
        "username": "duplicate",
        "email": "first@example.com",
        "password": "password123",
        "role": "user",
    }

    # Act: Create first user
    create_response = await client.post(
        "/api/users", json=user_data, headers=auth_headers
    )

    # Assert: First user should be created successfully
    assert create_response.status_code == 201
    first_user_id = create_response.json()["id"]

    # Assert: Verify the first user was actually created in the database
    get_response = await client.get(f"/api/users/{first_user_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["username"] == "duplicate"

    # Act: Try to create a second user with the same username (different email)
    user_data["email"] = "second@example.com"
    response = await client.post("/api/users", json=user_data, headers=auth_headers)

    # Assert: Should return 400 (or similar) with error message about duplicate
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

    # Assert: Original user should still exist and be unchanged
    # This verifies that the duplicate attempt didn't affect the existing user
    get_response = await client.get(f"/api/users/{first_user_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert (
        get_response.json()["email"] == "first@example.com"
    )  # Original email unchanged

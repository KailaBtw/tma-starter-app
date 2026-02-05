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


# List all users (DONE)
# Route: /api/users
# Request: GET
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


# Get a single user
# Route: /api/users/{id}
# Request: GET
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
async def test_get_user_by_id_with_auth(client: AsyncClient, auth_headers, admin_user):
    """Test that GET /api/users/{id} returns a user when authenticated"""
    response = await client.get("/api/users/1", headers=auth_headers)
    data = response.json()
    assert response.status_code == 200

    assert "id" in data
    assert "username" in data
    assert "email" in data
    assert "role" in data
    assert "password" not in data  # Password should never be in response

    # Verify the admin user is in the list

    assert data["username"] == "admin"


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


# Create a new user (admin only) (DONE)
# Route: /api/users/{id}
# Request: POST
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


# Update user
# Route: /api/users/{id}
# Request: PATCH
@pytest.mark.asyncio
async def test_update_user_success(client: AsyncClient, auth_headers):
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


@pytest.mark.asyncio
async def test_update_user_validation_error(client: AsyncClient, auth_headers):
    response = await client.patch(
        "/api/users/1", json={"first_name": 7}, headers=auth_headers
    )
    assert response.status_code == 422


# Delete user
# Route: /api/users/{id}
# Request: DELETE
@pytest.mark.asyncio
async def test_delete_user_self_not_allowed(client: AsyncClient, auth_headers):
    response = await client.delete("/api/users/1", headers=auth_headers)
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
    payload = {"user_id": "1", "is_active": True}
    response = await client.patch(
        "/api/users/99999/status", json=payload, headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_user_status_validation_error(client: AsyncClient, auth_headers):
    response = await client.patch(
        "/api/users/1/status", json={"status": 7}, headers=auth_headers
    )
    assert response.status_code == 422


# Update user role
# Route: /api/users/{id}/role
# Request: PATCH
@pytest.mark.asyncio
async def test_update_user_role_id_not_found(client: AsyncClient, auth_headers):
    payload = {"user_id": "1", "role": "manager"}
    response = await client.patch(
        "/api/users/99999/role", json=payload, headers=auth_headers
    )
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
    get_response = await client.patch(
        f"/api/users/{id}/role", json=payload, headers=auth_headers
    )
    assert get_response.status_code == 200
    data = get_response.json()
    # assert that the role has changed
    assert data["role"]["name"] == "manager"

    get_response2 = await client.get(f"/api/users/{id}", headers=auth_headers)
    assert get_response2.status_code == 200
    data = get_response2.json()
    assert data["role"]["name"] == "manager"


@pytest.mark.asyncio
async def test_update_user_role_validation_error(client: AsyncClient, auth_headers):
    response = await client.patch(
        "/api/users/1/role", json={"role": 7}, headers=auth_headers
    )
    assert response.status_code == 422

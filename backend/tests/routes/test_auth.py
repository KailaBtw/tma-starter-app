"""
Contract-level tests for the /api/auth endpoint

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
from jose import jwt

from auth import ALGORITHM, SECRET_KEY


@pytest.mark.asyncio
async def test_get_all_users_requires_auth(client: AsyncClient):
    """
    Test that GET /api/auth/users requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    This is a security requirement - users endpoint should be protected.
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/auth/users")
    # Assert: Should return 401 (Unauthorized)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_all_users_requires_admin(
    client: AsyncClient, regular_user_auth_headers
):
    """
    Test that GET /api/auth/users requires authentication

    Contract: access to admin resources should require admin rights
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/auth/users", headers=regular_user_auth_headers)
    # Assert: Should return 403 (Forbidden)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_all_users_with_admin_auth(
    client: AsyncClient, auth_headers, admin_user
):
    """
    Test that GET /api/auth/users returns list of users when authenticated

    Contract: Authenticated admin users can retrieve all users
    - Status: 200 OK
    - Response: List of user objects
    - Each user should have: id, username, email, role
    - Password should NEVER be in response (security)
    """
    # Act: Make authenticated request
    response = await client.get("/api/auth/users", headers=auth_headers)

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
async def test_create_admin_requires_admin(
    client: AsyncClient, regular_user_auth_headers
):
    """
    Test that POST /api/auth/register

    Only admins can create users with admin or manager role.
    Contract: Authenticated non-admin gets 403 when registering with role admin/manager.
    """
    # Arrange: Prepare user data (valid format)
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "role": "admin",
    }

    # Act: Call register with regular-user auth (non-admin)
    response = await client.post(
        "/api/auth/register", json=user_data, headers=regular_user_auth_headers
    )

    # Assert: Should return 403 (Forbidden - only admins can create admin/manager)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_admin_requires_auth(client: AsyncClient):
    """
    Test that POST /api/auth/register requires auth to make an admin account.

    Contract: Creating admin/manager accounts requires auth (unauthenticated gets 403).
    """
    # Arrange: Prepare user data (valid format)
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "role": "admin",
    }

    # Act: Call register without authentication headers
    response = await client.post("/api/auth/register", json=user_data)

    # Assert: Should return 403 (Forbidden - must be authenticated admin)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_user_without_auth_success(client: AsyncClient):
    """
    Test that POST /api/auth/register works for new users.
    Auth/Admin is NOT required to make a new account, nor is auth.

    Contract: New users can be made without being authenticated as a user/admin
    """
    # Arrange: Prepare user data (valid format)
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "role": "user",
    }

    # Act: Call admin create-user endpoint without authentication headers
    response = await client.post("/api/auth/register", json=user_data)

    # Assert: Should return 201
    assert response.status_code == 201

    # Assert: Response should contain the created user data
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "id" in data  # User should have an ID assigned
    assert "password" not in data  # Security: Password should never be in response


@pytest.mark.asyncio
async def test_create_user_with_auth_success(client: AsyncClient, auth_headers):
    """
    Test that POST /api/auth/register creates a user successfully

    Contract: When creating a user with valid data:
    - Status: 201 Created
    - Response: User object with id, username, email, role
    - Password should NOT be in response (security)

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
    response = await client.post(
        "/api/auth/register", json=user_data, headers=auth_headers
    )

    # Assert: Should return 201 Created
    assert response.status_code == 201

    # Assert: Response should contain the created user data
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "id" in data  # User should have an ID assigned
    assert "password" not in data  # Security: Password should never be in response


@pytest.mark.asyncio
async def test_create_user_missing_fields(client: AsyncClient, auth_headers):
    """
    Test that POST /api/auth/register returns 422 for missing required fields

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
    response = await client.post(
        "/api/auth/register", json=user_data, headers=auth_headers
    )

    # Assert: Should return 422 (validation error)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_user_duplicate_username(
    client: AsyncClient, auth_headers, test_db
):
    """
    Test that POST /api/auth/register returns error for duplicate username

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
        "/api/auth/register", json=user_data, headers=auth_headers
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
    response = await client.post(
        "/api/auth/register", json=user_data, headers=auth_headers
    )

    # Assert: Should return 400 with error message about duplicate username
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()

    # Assert: Original user should still exist and be unchanged
    # This verifies that the duplicate attempt didn't affect the existing user
    get_response = await client.get(f"/api/users/{first_user_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert (
        get_response.json()["email"] == "first@example.com"
    )  # Original email unchanged


# tests for /auth/login
@pytest.mark.asyncio
async def test_invalid_login_password(client: AsyncClient):
    """
    Test POST /api/auth/login

    Contract: should return 401:Invalid credentials (user not found or wrong password)
    """
    # Arrange: Prepare login data (valid format)
    user_data = {
        "username": "user",
        # Dummy hash - we're not testing password hashing
        "password": "wrong_password",
    }

    # Act: Call login
    response = await client.post("/api/auth/login", json=user_data)

    # Assert: Should return 401 (Invalid credentials (user not found or wrong password))
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invalid_login_username(client: AsyncClient):
    """
    Test POST /api/auth/login

    Contract: should return 401:Invalid credentials (user not found or wrong password)
    """
    # Arrange: Prepare login data (valid format)
    user_data = {
        "username": "wrong_user",
        # Dummy hash - we're not testing password hashing
        "password": "testpassword123",
    }

    # Act: Call login
    response = await client.post("/api/auth/login", json=user_data)

    # Assert: Should return 401 (Invalid credentials (user not found or wrong password))
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invalid_login_format(client: AsyncClient):
    """
    Test POST /api/auth/login

    Contract: should return 401:Invalid credentials (user not found or wrong password)
    """
    # Arrange: Prepare login data (valid format)
    user_data = {
        "user": "wrong_user",
        # Dummy hash - we're not testing password hashing
        "pass": "testpassword123",
    }

    # Act: Call login
    response = await client.post("/api/auth/login", json=user_data)

    # Assert: Should return 422 Validation error (invalid input format)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_valid_login_credentials(
    client: AsyncClient, regular_user
):  # leave regular_user as a dependency!
    """
    Test POST /api/auth/login

    Contract: should return Status: 200 OK
    """
    # Arrange: Prepare login data (valid format)
    user_data = {
        "username": "user",
        "password": "testpassword123",
    }

    # Act: Call login
    response = await client.post("/api/auth/login", json=user_data)

    # Assert: Should return 200
    assert response.status_code == 200

    # now verify access_token and token_type
    data = response.json()
    assert "access_token" in data
    assert isinstance(data["access_token"], str)
    assert len(data["access_token"]) > 0
    assert data.get("token_type", "").lower() == "bearer"

    # now verify the payload (we accessed the correct profile)
    payload = jwt.decode(data["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    assert payload.get("sub") == "user"
    assert "exp" in payload


# tests for /auth/me
@pytest.mark.asyncio
async def test_get_me_requires_auth(client: AsyncClient):
    """
    Test that GET /api/auth/me requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    This is a security requirement - user endpoint should be protected.
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/auth/me")
    # Assert: Should return 401 (Unauthorized)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_success(client: AsyncClient, auth_headers, admin_user):
    """
    Test that GET /api/auth/me returns the user when authenticated

    Contract: Authenticated user can retrieve themselves
    - Status: 200 OK
    - Response: user object
    - Each user should have: id, username, email, role
    - Password should NEVER be in response (security)
    """
    # Act: Make authenticated request
    response = await client.get("/api/auth/me", headers=auth_headers)

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should be a list
    data = response.json()

    # Assert: List should contain data
    assert len(data) >= 1

    # Assert: user should have the expected structure
    # This verifies the response schema matches what the API contract promises
    assert "id" in data
    assert "username" in data
    assert "email" in data
    assert "role" in data
    assert "password" not in data  # Security: Password should never be in response
    assert data["role"]["name"] == "admin"  # the correct prems
    assert data["username"] == "admin"  # the correct user


# tests for  /auth/users/disable
@pytest.mark.asyncio
async def test_disable_user_requires_auth(
    client: AsyncClient, regular_user, admin_user
):
    """
    Test that PATCH /api/auth/users/disable requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    This is a security requirement - user endpoint should be protected.
    """
    # Prepare request body (valid format)
    #    user_id: int
    #    is_active: bool
    user_data = {
        "user_id": 2,
        "is_active": False,
    }

    # Act: Make request without authentication headers
    response = await client.patch("/api/auth/users/disable", json=user_data)
    # Assert: Should return 401 (Unauthorized)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_disable_user_requires_admin(
    client: AsyncClient, regular_user_auth_headers
):
    """
    Test that PATCH /api/auth/users/disable requires admin prems

    Contract: access to admin resources should require admin rights
    """
    # Prepare request body (valid format)
    user_data = {
        "user_id": "2",
        "is_active": "false",
    }
    # Act: Make request with regular user headers
    response = await client.patch(
        "/api/auth/users/disable", json=user_data, headers=regular_user_auth_headers
    )
    # Assert: Should return 403 (Forbidden)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_disable_self_fails(client: AsyncClient, auth_headers):
    """
    Test that PATCH /api/auth/users/disable

    Contract: errors out if trying to disable yourself
    """
    # Prepare request body (valid format)
    user_data = {
        "user_id": "1",
        "is_active": "false",
    }
    # Act: Make request without authentication headers
    response = await client.patch(
        "/api/auth/users/disable", json=user_data, headers=auth_headers
    )
    # Assert: Should return 400: bad request (trying to disable your own account)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_disable_fake_account_fails(client: AsyncClient, auth_headers):
    """
    Test that PATCH /api/auth/users/disable

    Contract: errors out if trying to disable a non-existent user
    """
    # Prepare request body (valid format)
    user_data = {
        "user_id": "9999",
        "is_active": "false",
    }
    # Act: Make bad request
    response = await client.patch(
        "/api/auth/users/disable", json=user_data, headers=auth_headers
    )
    # Assert: Should return 404: (user not found)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_disable_user_success(client: AsyncClient, auth_headers, regular_user):
    """
    Test that PATCH /api/auth/users/disable

    Contract: admin accounts can disable a standard user account
    """
    # Prepare request body (valid format)
    user_data = {
        "user_id": "2",
        "is_active": "false",
    }
    # Act: Make good request
    response = await client.patch(
        "/api/auth/users/disable", json=user_data, headers=auth_headers
    )
    # Assert: Should return 200
    assert response.status_code == 200

    data = response.json()
    # Assert: userResponse should have the expected structure
    # This verifies the response schema matches what the API contract promises
    assert data["id"] == regular_user.id
    assert "username" in data
    assert "email" in data
    assert "role" in data
    assert "password" not in data  # Security: Password should never be in response
    assert data["role"]["name"] == "user"
    assert data["username"] == "user"  # the correct user

    # verify disable in the response
    assert data["is_active"] is False

    response = await client.get("/api/users/2", headers=auth_headers)
    data = response.json()
    assert response.status_code == 200

    #  What else needs to be added here?
    assert data["is_active"] is False
    assert data["username"] != "admin"

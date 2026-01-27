"""
Contract-level tests for the /api/courses endpoint

These tests verify the API contract (behavior) from the client's perspective:
- Status codes (200, 201, 404, 401, 422, etc.)
    - Codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity
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

###############################################################################
# GET - get_all_courses tests
###############################################################################

@pytest.mark.asyncio
async def test_get_all_courses_needs_auth(client: AsyncClient):
    """
    Test that GET /api/courses requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    This is a security requirement - courses endpoint should be protected.
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/courses")

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_all_courses_success(client: AsyncClient, auth_headers, admin_user):
    """
    Test that GET /api/courses returns list of accessible courses when authenticated

    Contract: Authenticated users can retrieve all accessible courses
    - Status: 200 OK
    - Response: List of course objects (could be empty)
    """
    # Act: Make authenticated request
    response = await client.get("/api/courses", headers=auth_headers)

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should be a list
    data = response.json()
    assert isinstance(data, list)
    
@pytest.mark.asyncio
async def test_get_all_courses_not_empty(client: AsyncClient, auth_headers, admin_user):
    """
    Test that GET /api/courses returns *non-empty* list when courses exist

    Contract: When courses exist in the system:
    - Status: 200 OK
    - Response: Non-empty list of course objects, each with expected fields (only tests first item)
    """
    # Act: Make authenticated request
    response = await client.get("/api/courses", headers=auth_headers)

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should be a list
    data = response.json()
    assert isinstance(data, list)
    
    # Assert: List should not be empty
    assert len(data) > 0
    
    # Assert: First item should have expected fields
    first_course = data[0]
    assert "id" in first_course
    assert "name" in first_course
    assert "description" in first_course
    assert "created_at" in first_course
    assert "updated_at" in first_course
    # Todo: Add more field checks as needed
    
    
###############################################################################
# GET - get_course tests
###############################################################################

@pytest.mark.asyncio
async def test_get_course_by_id_needs_auth(client: AsyncClient):
    """
    Test that GET /api/courses/{id} requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    Even with a valid course ID, needs auth.
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/courses/1")

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_course_by_id_not_found(client: AsyncClient, auth_headers):
    """
    Test that GET /api/courses/{id} returns 404 for non-existent course

    Contract: When requesting a course that doesn't exist:
    - Status: 404 Not Found
    - Response: Error message indicating course not found
    """
    # Act: Request a course ID that doesn't exist
    response = await client.get("/api/courses/99999", headers=auth_headers)

    # Assert: Should return 404 Not Found
    assert response.status_code == 404

    # Assert: Error message should indicate course not found
    data = response.json()
    assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_get_course_by_id_success(client: AsyncClient, auth_headers):
    """
    Test that GET /api/courses/{id} returns course details when authenticated

    Contract: When requesting an existing course:
    - Status: 200 OK
    - Response: Course object with expected fields
    """
    # Act: Request a course ID that exists (assuming here that a course with ID of 1 exists in DB)
    response = await client.get("/api/courses/1", headers=auth_headers)
    
    # Assert: Should return 200 OK
    assert response.status_code == 200
    
    # Assert: Response should be a course object with expected fields
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert "description" in data
    assert "created_at" in data
    assert "updated_at" in data
    # Todo: Add more field checks as needed
    

###############################################################################
# POST - create_course tests
###############################################################################

@pytest.mark.asyncio
async def test_create_course_needs_auth(client: AsyncClient):
    """
    Test that POST /api/courses requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    Creating courses requires admin privileges.
    """
    # Arrange: Prepare course data valid format
    course_data = {
        "name": "Suauce",
        "description": "Bruh Bruh Bruh",
        # I think (hope) created_at and updated_at are auto seeded by backend???
        # Todo: add more fields as needed
    }

    # Act: Make request without authentication headers
    response = await client.post("/api/courses", json=course_data)

    # Assert: Should return 401 Unauthorized even with valid data
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_course_invalid_input(client: AsyncClient, auth_headers, admin_user):
    """
    Test that POST /api/courses returns 422 for missing required fields

    Contract: When creating a course with missing required fields:
    - Status: 422 Unprocessable Entity
    - This tests input validation - the API should reject invalid input

    Note: Even with authentication, invalid data should be rejected
    """
    course_data = {
        # "name" is missing
        "description": "Bruh Bruh Bruh",
    }
    
    # Act: Make authenticated request with input
    response = await client.post(
        "/api/courses", json=course_data, headers=auth_headers
    )

    # Assert: Should return 422 Unprocessable Entity
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_course_success(client: AsyncClient, auth_headers, test_db, admin_user):
    """
    Test that POST /api/courses creates a course successfully

    Contract: When creating a course with valid data:
    - Status: 201 Created
    - Response: Course object with id and provided fields
    - Course should be retrievable via GET /api/courses/{id}

    Note: test_db fixture ensures fresh database for each test
    """
    course_data = {
        "name": "Suauce",
        "description": "Bruh Bruh Bruh",
        # I think (hope) created_at and updated_at are auto seeded by backend???
        # Todo: add more fields as needed
    }

    # Act: Make authenticated request to create course
    response = await client.post(
        "/api/courses", json=course_data, headers=auth_headers
    )

    # Assert: Should return 201 Created
    assert response.status_code == 201

    # Assert: Response should contain course object with id
    data = response.json()
    assert "id" in data
    assert data["name"] == course_data["name"]
    assert data["description"] == course_data["description"]
    assert data["created_at"] is not None
    assert data["updated_at"] is not None

    created_course_id = data["id"]

    # Act: Retrieve the created course via GET
    get_response = await client.get(
        f"/api/courses/{created_course_id}", headers=auth_headers
    )

    # Assert: GET should return 200 OK
    assert get_response.status_code == 200

    # Assert: Retrieved course should match created data
    get_data = get_response.json()
    assert get_data["id"] == created_course_id
    assert get_data["name"] == course_data["name"]
    assert get_data["description"] == course_data["description"]
    assert get_data["created_at"] is not None
    assert get_data["updated_at"] is not None


###############################################################################
# PATCH - update_course tests
###############################################################################

@pytest.mark.asyncio
async def test_update_course_requires_auth(client: AsyncClient):
    """
    Test that PATCH /api/courses/{id} requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    Updating courses requires admin privileges, so authentication is mandatory.
    """
    # Act: Make request without authentication headers
    response = await client.patch("/api/courses/1", json={"name": "Bruh New"})
    
    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_course_not_found(client: AsyncClient, auth_headers, admin_user):
    """
    Test that PATCH /api/courses/{id} returns 404 for non-existent course

    Contract: When updating a course that doesn't exist:
    - Status: 404 Not Found
    - Response: Error message indicating course not found
    """
    # Act: Make authenticated request to update non-existent course
    response = await client.patch(
        "/api/courses/99999", json={"name": "Bruh New"}, headers=auth_headers
    )

    # Assert: Should return 404 Not Found
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_course_success(client: AsyncClient, auth_headers, admin_user):
    """
    Test that PATCH /api/courses/{id} updates a course successfully

    Contract: When updating a course with valid data:
    - Status: 200 OK
    - Response: Updated course object
    - Changes should be persisted (verifiable via GET)
    """
    # Arrange: Prepare update data
    updated_data = {
        "name": "New Suauce",
        "description": "Bruh Bruh Bruh but better",
    }

    # Act: Make authenticated request to update existing course (assuming ID 1 exists)
    response = await client.patch(
        "/api/courses/1", json=updated_data, headers=auth_headers
    )

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should contain updated course object
    data = response.json()
    assert data["id"] == 1
    assert data["name"] == updated_data["name"]
    assert data["description"] == updated_data["description"]
    assert data["created_at"] is not None
    assert data["updated_at"] is not None
    # Todo: Add more field checks as needed

    # Act: Retrieve the updated course via GET
    get_response = await client.get("/api/courses/1", headers=auth_headers)

    # Assert: GET should return 200 OK
    assert get_response.status_code == 200

    # Assert: Retrieved course should reflect updates
    get_data = get_response.json()
    assert get_data["id"] == 1
    assert get_data["name"] == updated_data["name"]
    assert get_data["description"] == updated_data["description"]
    assert get_data["created_at"] is not None
    assert get_data["updated_at"] is not None

###############################################################################
# DELETE - delete_course tests
###############################################################################

@pytest.mark.asyncio
async def test_delete_course_requires_auth(client: AsyncClient):
    """
    Test that DELETE /api/courses/{id} requires authentication

    Contract: Unauthenticated requests should return 401 Unauthorized
    Deleting courses requires admin privileges, so authentication is mandatory.
    """
    # Act: Make request without authentication headers
    response = await client.delete("/api/courses/1")
    
    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_course_not_found(client: AsyncClient, auth_headers, admin_user):
    """
    Test that DELETE /api/courses/{id} returns 404 for non-existent course

    Contract: When deleting a course that doesn't exist:
    - Status: 404 Not Found
    - Response: Error message indicating course not found
    """
    # Act: Make authenticated request to delete non-existent course
    response = await client.delete(
        "/api/courses/99999", headers=auth_headers
    )

    # Assert: Should return 404 Not Found
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_course_success(client: AsyncClient, auth_headers, admin_user):
    """
    Test that DELETE /api/courses/{id} deletes a course successfully

    Contract: When deleting an existing course:
    - Status: 204 No Content
    - Course should no longer be retrievable via GET
    """
    # Act: Make authenticated request to delete existing course (assuming ID 1 exists)
    response = await client.delete(
        "/api/courses/1", headers=auth_headers
    )
    
    # Assert: Should return 204 No Content
    assert response.status_code == 204
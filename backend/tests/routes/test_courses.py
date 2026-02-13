"""
Contract-level tests for the /api/courses endpoint

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

from models import Course
from tests.conftest import TestSessionLocal

###############################################################################
# Test fixtures for course data
###############################################################################


@pytest.fixture
async def test_course(test_db):
    """
    Create a test course in the database.
    """
    async with TestSessionLocal() as session:
        course = Course(
            title="suauce",
            description="bruh bruh bruh",
        )
        session.add(course)
        await session.commit()
        await session.refresh(course)
        return course


###############################################################################
# GET - get_all_courses tests
###############################################################################


@pytest.mark.asyncio
async def test_get_all_courses_needs_auth(client: AsyncClient):
    """
    Test that GET /api/courses requires authentication.

    Contract:
    - Input: Unauthenticated request
    - Behavior: should return 401 Unauthorized
    - Output: 401 status code
    - Errors: None
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/courses")

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_all_courses_success(client: AsyncClient, auth_headers, admin_user):
    """
    Test that GET /api/courses returns list of accessible courses when authenticated and admin. # noqa E501

    Contract:
    - Input: Authenticated request with admin privileges
    - Behavior: Should return a list of all courses in the db
    - Output: 200 OK with a list of courses (could be empty)
    - Errors: the list could be empty 
    """
    # Act: Make authenticated request
    response = await client.get("/api/courses", headers=auth_headers)

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should be a list
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_all_courses_not_empty(
    client: AsyncClient, auth_headers, admin_user, test_course
):
    """
    Test that GET /api/courses returns *non-empty* list when courses exist

    Contract:
    - Input: Authenticated request with admin privs
    - Behavior: Should return a list of all courses in the db (with at least one entry) # noqa E501
    - Output: 200 OK with a non-empty list of courses
    - Errors: Course list is empty, or course has missing/unexpected fields
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
    assert "title" in first_course
    assert "description" in first_course
    assert "created_at" in first_course
    assert "updated_at" in first_course
    # Todo: Add more field checks as needed


###############################################################################
# GET - get_course/{id} tests
###############################################################################


@pytest.mark.asyncio
async def test_get_course_by_id_needs_auth(client: AsyncClient):
    """
    Test that GET /api/courses/{id} requires authentication

    Contract:
    - Input: Unauthenticated request for a specific course ID
    - Behavior: returns 401 status code
    - Output: 401 status code
    - Errors: None
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/courses/1")

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_course_by_id_not_found(client: AsyncClient, auth_headers):
    """
    Test that GET /api/courses/{id} returns 404 for non-existent course

    Contract:
    - Input: Authenticated request for a course ID that doesn't exist
    - Behavior: returns 404 status and error message
    - Output: 404 Not found
    - Errors: None
    """
    # Act: Request a course ID that doesn't exist
    response = await client.get("/api/courses/99999", headers=auth_headers)

    # Assert: Should return 404 Not Found
    assert response.status_code == 404

    # Assert: Error message should indicate course not found
    data = response.json()
    assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_get_course_by_id_success(client: AsyncClient, auth_headers, test_course):
    """
    Test that GET /api/courses/{id} returns course details when authenticated

    Contract:
    - Input: Authenticated request for an existing course ID
    - Behavior: returns 200 status and course details
    - Output: 200 OK with course object
    - Errors: Course has missing/unexpected fields, or no course returned
    """
    # Act: Request a course ID that exists
    response = await client.get(f"/api/courses/{test_course.id}", headers=auth_headers)

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should be a course object with expected fields
    data = response.json()
    assert data["id"] == test_course.id
    assert data["title"] == test_course.title
    assert "id" in data
    assert "title" in data
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

    Contract:
    - Input: Unauthenticated request with valid course data
    - Behavior: Should return a 401
    - Output: 401 Unauthorized
    - Errors: None
    """
    # Arrange: Prepare course data valid format
    course_data = {
        "title": "Suauce",
        "description": "Bruh Bruh Bruh",
        # I think (hope) created_at and updated_at are auto seeded by backend???
        # Todo: add more fields as needed
    }

    # Act: Make request without authentication headers
    response = await client.post("/api/courses", json=course_data)

    # Assert: Should return 401 Unauthorized even with valid data
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_course_invalid_input(
    client: AsyncClient, auth_headers, admin_user
):
    """
    Test that POST /api/courses returns 422 for missing required fields

    Contract:
    - Input: Authenticated request with invalid course data
    - Behavior: Should return a 422
    - Output: 422 Status code
    - Errors: None
    """
    course_data = {
        # "title" is missing
        "description": "Bruh Bruh Bruh",
    }

    # Act: Make authenticated request with input
    response = await client.post("/api/courses", json=course_data, headers=auth_headers)

    # Assert: Should return 422 Unprocessable Entity
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_course_success(
    client: AsyncClient, auth_headers, test_db, admin_user
):
    """
    Test that POST /api/courses creates a course successfully

    Contract:
    - Input: Authenticated request with valid data
    - Behavior: create the course and return 201 and add to db
    - Output: 201 Created with course object
    - Errors: Course has missing/unexpected fields, course not persisted, or course retrieved has wrong data # noqa E501
    """
    course_data = {
        "title": "Suauce",
        "description": "Bruh Bruh Bruh",
        # I think (hope) created_at and updated_at are auto seeded by backend???
        # Todo: add more fields as needed
    }

    # Act: Make authenticated request to create course
    response = await client.post("/api/courses", json=course_data, headers=auth_headers)

    # Assert: Should return 201 Created
    assert response.status_code == 201

    # Assert: Response should contain course object with id
    data = response.json()
    assert "id" in data
    assert data["title"] == course_data["title"]
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
    assert get_data["title"] == course_data["title"]
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

    Contract:
    - Input: Unauthenticated request
    - Behavior: Should return 401
    - Output: 401 Unauthorized
    - Errors: None
    """
    # Act: Make request without authentication headers
    response = await client.patch("/api/courses/1", json={"title": "Bruh New"})

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_course_not_found(client: AsyncClient, auth_headers, admin_user):
    """
    Test that PATCH /api/courses/{id} returns 404 for non-existent course

    Contract:
    - Input: Authenticated request for a course ID that doesn't exist
    - Behavior: return 404 status code
    - Output: 404 Not Found
    - Errors: None
    """
    # Act: Make authenticated request to update non-existent course
    response = await client.patch(
        "/api/courses/99999", json={"title": "Bruh New"}, headers=auth_headers
    )

    # Assert: Should return 404 Not Found
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_course_success(
    client: AsyncClient, auth_headers, admin_user, test_course
):
    """
    Test that PATCH /api/courses/{id} updates a course successfully

    Contract:
    - Input: Authenticated request with valid new data and existing course ID
    - Behavior: Update the course and return 200 with updated course data
    - Output: 200 OK and updated course object
    - Errors: Course has missing/unexpected fields, updates not persisted, or course retrieved has wrong data # noqa E501
    """
    # Arrange: Prepare update data
    updated_data = {
        "title": "New Suauce",
        "description": "Bruh Bruh Bruh but better",
    }

    # Act: Make authenticated request to update existing course
    response = await client.patch(
        f"/api/courses/{test_course.id}", json=updated_data, headers=auth_headers
    )

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should contain updated course object
    data = response.json()
    assert data["id"] == test_course.id
    assert data["title"] == updated_data["title"]
    assert data["description"] == updated_data["description"]
    assert data["created_at"] is not None
    assert data["updated_at"] is not None
    # Todo: Add more field checks as needed

    # Act: Retrieve the updated course via GET
    get_response = await client.get(
        f"/api/courses/{test_course.id}", headers=auth_headers
    )

    # Assert: GET should return 200 OK
    assert get_response.status_code == 200

    # Assert: Retrieved course should reflect updates
    get_data = get_response.json()
    assert get_data["id"] == test_course.id
    assert get_data["title"] == updated_data["title"]
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

    Contract:
    - Input: Unauthenticated request
    - Behavior: Should return 401
    - Output: 401 Unauthorized
    - Errors: None
    """
    # Act: Make request without authentication headers
    response = await client.delete("/api/courses/1")

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_course_not_found(client: AsyncClient, auth_headers, admin_user):
    """
    Test that DELETE /api/courses/{id} returns 404 for non-existent course

    Contract:
    - Input: Authenticated request for a course ID that doesn't exist
    - Behavior: return a 404 status code
    - Output: 404 Not Found
    - Errors: None
    """
    # Act: Make authenticated request to delete non-existent course
    response = await client.delete("/api/courses/99999", headers=auth_headers)

    # Assert: Should return 404 Not Found
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_course_success(
    client: AsyncClient, auth_headers, admin_user, test_course
):
    """
    Test that DELETE /api/courses/{id} deletes a course successfully

    Contract:
    - Input: Authenticated request for an existing course ID
    - Behavior: Delete the course and return a 204 No Content
    - Output: 204 No Content
    - Errors: Course not deleted, or course still retrievable after deletion
    """
    # Act: Make authenticated request to delete existing course
    response = await client.delete(
        f"/api/courses/{test_course.id}", headers=auth_headers
    )

    # Assert: Should return 204 No Content
    assert response.status_code == 204

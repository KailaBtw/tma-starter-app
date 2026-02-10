"""
Contract-level tests for the /api/modules endpoint

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

from models import Course, CourseModule, CourseUser, Module
from tests.conftest import TestSessionLocal

###############################################################################
# Test fixtures for module and course data
###############################################################################


@pytest.fixture
async def test_module(test_db):
    """
    Create a test module in the database.
    This is kept for backwards compatibility with any module-based tests.
    """
    async with TestSessionLocal() as session:
        module = Module(
            title="Vsuauce",
            description="Michael here",
        )
        session.add(module)
        await session.commit()
        await session.refresh(module)
        return module


@pytest.fixture
async def modules_with_enrollments(test_db, regular_user):
    """
    Create test setup with courses, modules, and enrollments for testing access control.

    Setup:
    - Two courses: course_a and course_b
    - Three modules: module_a1, module_a2 (linked to course_a), module_b1 (linked to course_b) # noqa E501
    - regular_user is enrolled only in course_a

    This allows testing:
    - Admin sees all 3 modules
    - Regular user sees only module_a1 and module_a2 (from their enrolled course)
    """
    async with TestSessionLocal() as session:
        # Create courses
        course_a = Course(title="Course A", description="Course A description")
        course_b = Course(title="Course B", description="Course B description")
        session.add_all([course_a, course_b])
        await session.commit()
        await session.refresh(course_a)
        await session.refresh(course_b)

        # Create modules
        module_a1 = Module(title="Module A1", description="Module for Course A")
        module_a2 = Module(title="Module A2", description="Another module for Course A")
        module_b1 = Module(title="Module B1", description="Module for Course B")
        session.add_all([module_a1, module_a2, module_b1])
        await session.commit()
        await session.refresh(module_a1)
        await session.refresh(module_a2)
        await session.refresh(module_b1)

        # Link modules to courses via CourseModule
        session.add_all(
            [
                CourseModule(course_id=course_a.id, module_id=module_a1.id, ordering=1),
                CourseModule(course_id=course_a.id, module_id=module_a2.id, ordering=2),
                CourseModule(course_id=course_b.id, module_id=module_b1.id, ordering=1),
            ]
        )

        # Enroll regular_user ONLY in course_a
        session.add(CourseUser(course_id=course_a.id, user_id=regular_user.id))
        await session.commit()

        # Return the first module for backwards compatibility with tests that use test_module  # noqa E501
        # But also return a dict with all entities for tests that need them
        return {
            "course_a": course_a,
            "course_b": course_b,
            "module_a1": module_a1,
            "module_a2": module_a2,
            "module_b1": module_b1,
        }


###############################################################################
# GET - get_all_courses tests (will be adapted to modules)
###############################################################################
# UPDATE THESE TESTS BELOW FOR MODULES ENDPOINTS!!!

# @pytest.mark.asyncio
# async def test_get_all_courses_needs_auth(client: AsyncClient):
#     """
#     Test that GET /api/courses requires authentication

#     Contract: Unauthenticated requests should return 401 Unauthorized
#     This is a security requirement - courses endpoint should be protected.
#     """
#     # Act: Make request without authentication headers
#     response = await client.get("/api/courses")

#     # Assert: Should return 401 Unauthorized
#     assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_modules_user_only_theirs_success(
    client: AsyncClient,
    regular_user_auth_headers,
    regular_user,
    modules_with_enrollments,
):
    """
    Regular user should see only modules from courses they are enrolled in.
    """
    response = await client.get("/api/modules", headers=regular_user_auth_headers)
    assert response.status_code == 200

    data = response.json()
    ids = {m["id"] for m in data}

    m = modules_with_enrollments
    # User is enrolled only in course_a, which has module_a1 and module_a2
    assert m["module_a1"].id in ids
    assert m["module_a2"].id in ids
    # module_b1 belongs to course_b (no enrollment), so they should NOT see it
    assert m["module_b1"].id not in ids


@pytest.mark.asyncio
async def test_get_all_modules_admin_success(
    client: AsyncClient, auth_headers, admin_user, modules_with_enrollments
):
    """
    Admin should see all modules in the system.
    """
    response = await client.get("/api/modules", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    ids = {m["id"] for m in data}

    m = modules_with_enrollments
    assert m["module_a1"].id in ids
    assert m["module_a2"].id in ids
    assert m["module_b1"].id in ids
    assert len(ids) == 3


@pytest.mark.asyncio
async def test_get_modules_not_empty(
    client: AsyncClient, auth_headers, admin_user, test_module
):
    """
    Test that GET /api/modules returns *non-empty* list when modules exist

    Contract: When modules exist in the system:
    - Status: 200 OK
    """
    # Act: Make authenticated request
    response = await client.get("/api/modules", headers=auth_headers)

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should be a list
    data = response.json()
    assert isinstance(data, list)

    # Assert: List should not be empty
    assert len(data) > 0

    # Assert: First item should have expected fields
    first_module = data[0]
    assert "id" in first_module
    assert "title" in first_module
    assert "description" in first_module
    assert "created_at" in first_module
    assert "updated_at" in first_module
    # Todo: Add more field checks as needed


###############################################################################
# GET - get_course tests
###############################################################################


# @pytest.mark.asyncio
# async def test_get_course_by_id_needs_auth(client: AsyncClient):
#     """
#     Test that GET /api/courses/{id} requires authentication

#     Contract: Unauthenticated requests should return 401 Unauthorized
#     Even with a valid course ID, needs auth.
#     """
#     # Act: Make request without authentication headers
#     response = await client.get("/api/courses/1")

#     # Assert: Should return 401 Unauthorized
#     assert response.status_code == 401


# @pytest.mark.asyncio
# async def test_get_course_by_id_not_found(client: AsyncClient, auth_headers):
#     """
#     Test that GET /api/courses/{id} returns 404 for non-existent course

#     Contract: When requesting a course that doesn't exist:
#     - Status: 404 Not Found
#     - Response: Error message indicating course not found
#     """
#     # Act: Request a course ID that doesn't exist
#     response = await client.get("/api/courses/99999", headers=auth_headers)

#     # Assert: Should return 404 Not Found
#     assert response.status_code == 404

#     # Assert: Error message should indicate course not found
#     data = response.json()
#     assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_get_module_by_id_success(client: AsyncClient, auth_headers, test_module):
    """
    Test that GET /api/modules/{id} returns module details when authenticated

    Contract: When requesting an existing module:
    - Status: 200 OK
    - Response: module object with expected fields
    """
    # Act: Request a module ID that exists
    response = await client.get(f"/api/modules/{test_module.id}", headers=auth_headers)

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should be a module object with expected fields
    data = response.json()
    assert data["id"] == test_module.id
    assert data["title"] == test_module.title
    assert "id" in data
    assert "title" in data
    assert "description" in data
    assert "created_at" in data
    assert "updated_at" in data
    # Todo: Add more field checks as needed


###############################################################################
# POST - create_course tests
###############################################################################


# @pytest.mark.asyncio
# async def test_create_course_needs_auth(client: AsyncClient):
#     """
#     Test that POST /api/courses requires authentication

#     Contract: Unauthenticated requests should return 401 Unauthorized
#     Creating courses requires admin privileges.
#     """
#     # Arrange: Prepare course data valid format
#     course_data = {
#         "title": "Suauce",
#         "description": "Bruh Bruh Bruh",
#         # I think (hope) created_at and updated_at are auto seeded by backend???
#         # Todo: add more fields as needed
#     }

#     # Act: Make request without authentication headers
#     response = await client.post("/api/courses", json=course_data)

#     # Assert: Should return 401 Unauthorized even with valid data
#     assert response.status_code == 401


# @pytest.mark.asyncio
# async def test_create_course_invalid_input(
#     client: AsyncClient, auth_headers, admin_user
# ):
#     """
#     Test that POST /api/courses returns 422 for missing required fields

#     Contract: When creating a course with missing required fields:
#     - Status: 422 Unprocessable Entity
#     - This tests input validation - the API should reject invalid input

#     Note: Even with authentication, invalid data should be rejected
#     """
#     course_data = {
#         # "title" is missing
#         "description": "Bruh Bruh Bruh",
#     }

#     # Act: Make authenticated request with input
#     response = await client.post("/api/courses", json=course_data, headers=auth_headers)  # noqa E501

#     # Assert: Should return 422 Unprocessable Entity
#     assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_module_success(
    client: AsyncClient, auth_headers, test_db, admin_user
):
    """
    Test that POST /api/modules creates a module successfully

    Contract: When creating a module with valid data:
    - Status: 201 Created
    - Response: module object with id and provided fields
    - module should be retrievable via GET /api/modules/{id}

    Note: test_db fixture ensures fresh database for each test
    """
    module_data = {
        "title": "Suauce",
        "description": "Bruh Bruh Bruh",
        # I think (hope) created_at and updated_at are auto seeded by backend???
        # Todo: add more fields as needed
    }

    # Act: Make authenticated request to create module
    response = await client.post("/api/modules", json=module_data, headers=auth_headers)

    # Assert: Should return 201 Created
    assert response.status_code == 201

    # Assert: Response should contain module object with id
    data = response.json()
    assert "id" in data
    assert data["title"] == module_data["title"]
    assert data["description"] == module_data["description"]
    assert data["created_at"] is not None
    assert data["updated_at"] is not None

    created_module_id = data["id"]

    # Act: Retrieve the created module via GET
    get_response = await client.get(
        f"/api/modules/{created_module_id}", headers=auth_headers
    )

    # Assert: GET should return 200 OK
    assert get_response.status_code == 200

    # Assert: Retrieved module should match created data
    get_data = get_response.json()
    assert get_data["id"] == created_module_id
    assert get_data["title"] == module_data["title"]
    assert get_data["description"] == module_data["description"]
    assert get_data["created_at"] is not None
    assert get_data["updated_at"] is not None


###############################################################################
# PATCH - update_course tests
###############################################################################


# @pytest.mark.asyncio
# async def test_update_course_requires_auth(client: AsyncClient):
#     """
#     Test that PATCH /api/courses/{id} requires authentication

#     Contract: Unauthenticated requests should return 401 Unauthorized
#     Updating courses requires admin privileges, so authentication is mandatory.
#     """
#     # Act: Make request without authentication headers
#     response = await client.patch("/api/courses/1", json={"title": "Bruh New"})

#     # Assert: Should return 401 Unauthorized
#     assert response.status_code == 401


# @pytest.mark.asyncio
# async def test_update_course_not_found(client: AsyncClient, auth_headers, admin_user):
#     """
#     Test that PATCH /api/courses/{id} returns 404 for non-existent course

#     Contract: When updating a course that doesn't exist:
#     - Status: 404 Not Found
#     - Response: Error message indicating course not found
#     """
#     # Act: Make authenticated request to update non-existent course
#     response = await client.patch(
#         "/api/courses/99999", json={"title": "Bruh New"}, headers=auth_headers
#     )

#     # Assert: Should return 404 Not Found
#     assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_module_success(
    client: AsyncClient, auth_headers, admin_user, test_module
):
    """
    Test that PATCH /api/modules/{id} updates a module successfully

    Contract: When updating a module with valid data:
    - Status: 200 OK
    - Response: Updated module object
    - Changes should be persisted (verifiable via GET)
    """
    # Arrange: Prepare update data
    updated_data = {
        "title": "Hey VSuauce",
        "description": "Michael here.",
    }

    # Act: Make authenticated request to update existing module
    response = await client.patch(
        f"/api/modules/{test_module.id}", json=updated_data, headers=auth_headers
    )

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should contain updated module object
    data = response.json()
    assert data["id"] == test_module.id
    assert data["title"] == updated_data["title"]
    assert data["description"] == updated_data["description"]
    assert data["created_at"] is not None
    assert data["updated_at"] is not None
    # Todo: Add more field checks as needed

    # Act: Retrieve the updated module via GET
    get_response = await client.get(
        f"/api/modules/{test_module.id}", headers=auth_headers
    )

    # Assert: GET should return 200 OK
    assert get_response.status_code == 200

    # Assert: Retrieved module should reflect updates
    get_data = get_response.json()
    assert get_data["id"] == test_module.id
    assert get_data["title"] == updated_data["title"]
    assert get_data["description"] == updated_data["description"]
    assert get_data["created_at"] is not None
    assert get_data["updated_at"] is not None


###############################################################################
# DELETE - delete_course tests
###############################################################################


# @pytest.mark.asyncio
# async def test_delete_course_requires_auth(client: AsyncClient):
#     """
#     Test that DELETE /api/courses/{id} requires authentication

#     Contract: Unauthenticated requests should return 401 Unauthorized
#     Deleting courses requires admin privileges, so authentication is mandatory.
#     """
#     # Act: Make request without authentication headers
#     response = await client.delete("/api/courses/1")

#     # Assert: Should return 401 Unauthorized
#     assert response.status_code == 401


# @pytest.mark.asyncio
# async def test_delete_course_not_found(client: AsyncClient, auth_headers, admin_user):
#     """
#     Test that DELETE /api/courses/{id} returns 404 for non-existent course

#     Contract: When deleting a course that doesn't exist:
#     - Status: 404 Not Found
#     - Response: Error message indicating course not found
#     """
#     # Act: Make authenticated request to delete non-existent course
#     response = await client.delete("/api/courses/99999", headers=auth_headers)

#     # Assert: Should return 404 Not Found
#     assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_module_success(
    client: AsyncClient, auth_headers, admin_user, test_module
):
    """
    Test that DELETE /api/modules/{id} deletes a module successfully

    Contract: When deleting an existing module:
    - Status: 204 No Content
    - Module should no longer be retrievable via GET
    """
    # Act: Make authenticated request to delete existing module
    response = await client.delete(
        f"/api/modules/{test_module.id}", headers=auth_headers
    )

    # Assert: Should return 204 No Content
    assert response.status_code == 204

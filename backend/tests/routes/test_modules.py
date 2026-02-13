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
# GET - get_modules tests
###############################################################################


@pytest.mark.asyncio
async def test_get_modules_needs_auth(client: AsyncClient):
    """
    Test that GET /api/modules requires authentication

    Contract:
    - Input: Unauthenticated request
    - Behavior: Should return 401 Unauthorized
    - Output: 401 status code
    - Errors: None
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/modules")

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_modules_user_only_theirs_success(
    client: AsyncClient,
    regular_user_auth_headers,
    regular_user,
    modules_with_enrollments,
):
    """
    Regular user should see only modules from courses they are enrolled in.

    Contract:
        - Input: Authenticated request from regular user
        - Behavior: Should return only modules from courses the user is enrolled in
        - Output: 200 status code with list of modules
        - Errors: None
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
async def test_get_modules_admin_success(
    client: AsyncClient, auth_headers, admin_user, modules_with_enrollments
):
    """
    Admin should see all modules in the system.

    Contract:
        - Input: Authenticated request from admin user
        - Behavior: Should return all modules in the system
        - Output: 200 status code with list of all modules
        - Errors: None
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

    Contract:
        - Input: Authenticated request when modules exist
        - Behavior: Should return list of modules
        - Output: 200 status code with non-empty list
        - Errors: Empty list or empty module when proper modules exist
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
# GET - get_module/{id} tests
###############################################################################


@pytest.mark.asyncio
async def test_get_module_by_id_needs_auth(client: AsyncClient):
    """
    Test that GET /api/modules/{id} requires authentication

    Contract:
    - Input: Unauthenticated request
    - Behavior: Should return 401 Unauthorized
    - Output: 401 status code
    - Errors: None
    """
    # Act: Make request without authentication headers
    response = await client.get("/api/modules/1")

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_module_admin_success(
    client: AsyncClient, auth_headers, admin_user, modules_with_enrollments, test_module
):
    """
    Admin should see any module by ID.

    Contract:
        - Input: Authenticated request from admin user
        - Behavior: Should return the module with the specified ID
        - Output: 200 status code with the module details
        - Errors: None
    """
    # Act: Request a module ID that exists
    response = await client.get(f"/api/modules/{test_module.id}", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()

    # Assert: Returned module should match requested ID
    assert data["id"] == test_module.id


@pytest.mark.asyncio
async def test_get_module_by_id_not_found(client: AsyncClient, auth_headers):
    """
    Test that GET /api/modules/{id} returns 404 for non-existent module

    Contract:
        - Input: Authenticated request for non-existent module ID
        - Behavior: Should return 404 Not Found
        - Output: 404 status code with error message
        - Errors: Module not found
    """
    # Act: Request a module ID that doesn't exist
    response = await client.get("/api/modules/99999", headers=auth_headers)

    # Assert: Should return 404 Not Found
    assert response.status_code == 404

    # Assert: Error message should indicate module not found
    data = response.json()
    assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_get_module_by_id_success(client: AsyncClient, auth_headers, test_module):
    """
    Test that GET /api/modules/{id} returns module details when authenticated

    Contract:
        - Input: Authenticated request for existing module ID
        - Behavior: Should return the module details
        - Output: 200 status code with module object
        - Errors: None
    """
    # Act: Request a module ID that exists
    response = await client.get(f"/api/modules/{test_module.id}", headers=auth_headers)

    # Assert: Should return 200 OK
    assert response.status_code == 200

    # Assert: Response should be a module object with expected fields # noqa
    data = response.json()
    assert data["id"] == test_module.id
    assert data["title"] == test_module.title
    assert "id" in data
    assert "title" in data
    assert "description" in data
    assert "created_at" in data
    assert "updated_at" in data
    # Todo: Add more field checks as needed


@pytest.mark.asyncio
async def test_get_module_by_id_regular_user_accessible(
    client: AsyncClient, regular_user_auth_headers, modules_with_enrollments
):
    """
    Regular user GET /api/modules/{id} returns 200 for a module in their enrolled course.

    Contract:
        - regular_user is enrolled only in course_a; module_a1 is in course_a
        - GET module_a1 as regular user → 200 with module details
    """
    mods = modules_with_enrollments
    response = await client.get(
        f"/api/modules/{mods['module_a1'].id}", headers=regular_user_auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == mods["module_a1"].id
    assert data["title"] == mods["module_a1"].title


@pytest.mark.asyncio
async def test_get_module_by_id_regular_user_forbidden(
    client: AsyncClient, regular_user_auth_headers, modules_with_enrollments
):
    """
    Regular user GET /api/modules/{id} returns 404 for a module not in their courses.

    Contract:
        - regular_user is enrolled only in course_a; module_b1 is in course_b
        - GET module_b1 as regular user → 404 (module not found / not accessible)
    """
    mods = modules_with_enrollments
    response = await client.get(
        f"/api/modules/{mods['module_b1'].id}", headers=regular_user_auth_headers
    )
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


###############################################################################
# POST - create_module tests
###############################################################################


@pytest.mark.asyncio
async def test_create_module_needs_auth(client: AsyncClient):
    """
    Test that POST /api/modules requires authentication

    Contract:
        - Input: Unauthenticated request
        - Behavior: Should return 401 Unauthorized
        - Output: 401 status code
        - Errors: None
    """
    # Arrange: Prepare module data valid format
    module_data = {
        "title": "Suauce",
        "description": "Bruh Bruh Bruh",
    }

    # Act: Make request without authentication headers
    response = await client.post("/api/modules", json=module_data)
    # Assert: Should return 401 Unauthorized even with valid data
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_module_needs_admin(
    client: AsyncClient, regular_user_auth_headers
):
    """
    Test that POST /api/modules requires admin privileges

    Contract:
        - Input: Authenticated request from non-admin user
        - Behavior: Should return 403 Forbidden
        - Output: 403 status code
        - Errors: None
    """
    # Arrange: Prepare module data with valid format
    module_data = {
        "title": "Suauce",
        "description": "Bruh Bruh Bruh",
    }

    # Act: Make authenticated request from regular user
    response = await client.post(
        "/api/modules", json=module_data, headers=regular_user_auth_headers
    )

    # Assert: Should return 403 Forbidden for regular user
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_module_invalid_input(
    client: AsyncClient, auth_headers, admin_user
):
    """
    Test that POST /api/modules returns 422 for missing required fields

    Contract:
        - Input: Authenticated request with invalid module data (missing title)
        - Behavior: Should return 422 Unprocessable Entity
        - Output: 422 status code with error details
        - Errors: Missing required fields
    """
    module_data = {
        # "title" is missing
        "description": "Bruh Bruh Bruh",
    }

    # Act: Make authenticated request with input
    response = await client.post("/api/modules", json=module_data, headers=auth_headers)

    # Assert: Should return 422 Unprocessable Entity
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_module_success(
    client: AsyncClient, auth_headers, test_db, admin_user
):
    """
    Test that POST /api/modules creates a module successfully

    Contract:
        - Input: Authenticated request with valid module data
        - Behavior: Should create the module and return its details
        - Output: 201 Created with module object
        - Errors: None
    """
    module_data = {"title": "Suauce", "description": "Bruh Bruh Bruh"}

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
# PATCH - update_module tests
###############################################################################


@pytest.mark.asyncio
async def test_update_module_requires_auth(client: AsyncClient):
    """
    Test that PATCH /api/modules/{id} requires authentication

    Contract:
        - Input: Unauthenticated request
        - Behavior: Should return 401 Unauthorized
        - Output: 401 status code
        - Errors: None
    """
    # Act: Make request without authentication headers
    response = await client.patch("/api/modules/1", json={"title": "Bruh New"})

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_module_needs_admin(
    client: AsyncClient, regular_user_auth_headers
):
    """
    Test that PATCH /api/modules/{id} requires admin privileges

    Contract:
        - Input: Authenticated request from non-admin user
        - Behavior: Should return 403 Forbidden
        - Output: 403 status code
        - Errors: None
    """
    # Act: Make authenticated request from regular user to update module
    response = await client.patch(
        "/api/modules/1",
        json={"title": "New New Name"},
        headers=regular_user_auth_headers,
    )

    # Assert: Should return 403 Forbidden for regular user
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_module_not_found(client: AsyncClient, auth_headers, admin_user):
    """
    Test that PATCH /api/modules/{id} returns 404 for non-existent module

    Contract:
        - Input: Authenticated request with non-existent module ID
        - Behavior: Should return 404 Not Found
        - Output: 404 status code
        - Errors: Module not found
    """
    # Act: Make authenticated request to update non-existent module
    response = await client.patch(
        "/api/modules/99999", json={"title": "Bruh New"}, headers=auth_headers
    )

    # Assert: Should return 404 Not Found
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_module_success(
    client: AsyncClient, auth_headers, admin_user, test_module
):
    """
    Test that PATCH /api/modules/{id} updates a module successfully

    Contract:
        - Input: Authenticated request with valid update data
        - Behavior: Should update the module and return its details
        - Output: 200 OK with updated module object
        - Errors: None
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
# DELETE - delete_module tests
###############################################################################


@pytest.mark.asyncio
async def test_delete_module_requires_auth(client: AsyncClient):
    """
    Test that DELETE /api/modules/{id} requires authentication

    Contract:
        - Input: Unauthenticated request
        - Behavior: Should return 401 Unauthorized
        - Output: 401 status code
        - Errors: None
    """
    # Act: Make request without authentication headers
    response = await client.delete("/api/modules/1")

    # Assert: Should return 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_module_needs_admin(
    client: AsyncClient, regular_user_auth_headers
):
    """
    Test that DELETE /api/modules/{id} requires admin privileges

    Contract:
        - Input: Authenticated request from non-admin user
        - Behavior: Should return 403 Forbidden
        - Output: 403 status code
        - Errors: None
    """
    # Act: Make authenticated request by regular user to delete module
    response = await client.delete("/api/modules/1", headers=regular_user_auth_headers)

    # Assert: Should return 403 Forbidden for regular user
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_module_not_found(client: AsyncClient, auth_headers, admin_user):
    """
    Test that DELETE /api/modules/{id} returns 404 for non-existent module

    Contract:
        - Input: Authenticated request with non-existent module ID
        - Behavior: Should return 404 Not Found
        - Output: 404 status code
        - Errors: Module not found
    """
    # Act: Make authenticated request to delete non-existent module
    response = await client.delete("/api/modules/99999", headers=auth_headers)

    # Assert: Should return 404 Not Found
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_module_success(
    client: AsyncClient, auth_headers, admin_user, test_module
):
    """
    Test that DELETE /api/modules/{id} deletes a module successfully

    Contract:
        - Input: Authenticated request to delete an existing module
        - Behavior: Should delete the module
        - Output: 204 No Content
        - Errors: None
    """
    # Act: Make authenticated request to delete existing module
    response = await client.delete(
        f"/api/modules/{test_module.id}", headers=auth_headers
    )

    # Assert: Should return 204 No Content
    assert response.status_code == 204

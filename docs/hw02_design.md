## HW02 Design: Modules Feature

### 1. Overview

This document describes the design and implementation plan for the **Module** feature, including API endpoints, data modeling, schemas, tests, and team responsibilities. The goal is to provide CRUD operations for modules with appropriate authentication and role-based behavior, integrated into the existing course/group/user model.

## Design Rationale

Our core modeling decision was to treat `Module` as a reusable entity that can be attached to multiple courses. Reuse is represented explicitly via the `CourseModule` join table, which stores both the foreign keys (`course_id`, `module_id`) and an `ordering` column. This lets us place the same module in different courses, potentially in different positions, without duplicating module content or denormalizing data. Students access modules indirectly via course membership: a user enrolled in a course (`CourseUser`) can see all modules attached to that course via `CourseModule`, which is shown in the model diagram.

Relationships and ordering are handled consistently through join tables. `CourseUser` captures user–course enrollment, `CourseModule` captures course–module membership and module ordering within a course, and `ModulePost` captures module–post membership and ordering of posts within a module. By pushing ordering into the join tables rather than into `Course`, `Module`, or `Post` themselves, we preserve flexibility: the same module can appear in multiple courses with different orders, and the same post can be reused in multiple modules.

We considered alternatives, such as embedding modules directly inside courses, but rejected these because they either duplicated data or made reuse across courses difficult. The explicit join tables introduce a bit more schema complexity and require more careful joins in queries, but they make the modules extendable.

### 2. Division of Labor

#### 2.1 Turn-in Requirements

- **Team ER/model diagram**:  (Ellie)
  - Included in the repository or linked in PRs.
- **Design document**:  (Team Meeting)
  - This file: `docs/hw02_design.md`.

#### 2.2 Implementation Responsibilities

- **Connor – Behavior Contracts (Endpoints)**
  - Create behavior contracts as GitHub issues (one per endpoint).
  - Capture expected request/response shapes, status codes, and error cases.

- **Ellie – Module CRUD Endpoints**
  - Implement Module CRUD endpoints in `backend/routes/modules.py`:
    - `GET /api/modules`
    - `GET /api/modules/{id}`
    - `POST /api/modules`
    - `PATCH /api/modules/{id}`
    - `DELETE /api/modules/{id}`

- **Mira – Module Schemas**
  - Create and wire Pydantic schemas in `backend/schemas/module.py`.
  - Ensure schemas are used correctly in routes and responses.

- **Ellie & Ethan – Auth and Roles**
  - Enforce authentication and role-based behavior as in starter code:
    - Use `get_current_active_user`, `require_admin`, and security scheme.
    - Apply appropriate restrictions on create/update/delete operations.

- **Connor – Populate Script (Optional)**
  - Update populate script to create sample `Module` records for testing/demo.

- **Ethan – Contract-Level Tests**
  - Implement contract-level tests for all Module endpoints.
  - Each endpoint has:
    - At least **one success test**.
    - At least **two failure tests** (e.g., auth errors, not found, validation).

#### 2.3 Process Requirements

- All HW2-related work is submitted via **pull requests**.
- All PRs are **reviewed and approved** before merging.
- All HW2 changes are merged into `main` **before the deadline**.

#### 2.4 Individual Submission

- Each team member completes an **individual reflection** (200–350 words).
- Reflections are submitted via the **Weekly Reflection Form** (see section 3.3 of the assignment).

### 3. API Design

#### 3.1 Main Module Endpoints

Base path assumes the FastAPI app prefixes routes with `/api`.

- **List modules**
  - **Method**: `GET`
  - **Path**: `/api/modules`
  - **Description**: List modules accessible to the authenticated user.

- **Get single module**
  - **Method**: `GET`
  - **Path**: `/api/modules/{id}`
  - **Description**: Retrieve full details for a single module.

- **Create module**
  - **Method**: `POST`
  - **Path**: `/api/modules`
  - **Description**: Create a new module (admin only).

- **Update module**
  - **Method**: `PATCH`
  - **Path**: `/api/modules/{id}`
  - **Description**: Update basic fields of a module (admin only).

- **Delete module**
  - **Method**: `DELETE`
  - **Path**: `/api/modules/{id}`
  - **Description**: Delete a module (admin only).

#### 3.2 Related Course Endpoint (Existing/Out of Scope for HW02)

- **Course user management**
  - **Path**: `/api/course`
  - **Description**: CRUD operations for users in a course (handled separately).

### 4. Data Model & Schemas

#### 4.1 Models & Database (Connor)

- **File**: `backend/models/module.py`
- **Responsibilities**:
  - Define the `Module` SQLAlchemy model (id, title, description, timestamps).
  - Implement relationships:
    - Many-to-many with `Course` via `CourseModule` (ordering of modules in a course).
    - Relationship to posts via `ModulePost` (ordering of posts in a module).
  - Add/adjust any database migrations if required.
  - Keep relationships consistent with existing models (`Course`, `CourseModule`, `ModulePost`, etc.).

#### 4.2 Schemas (Mira)

- **File**: `backend/schemas/module.py`
- **Responsibilities**:
  - Pydantic schemas for modules, modeled similarly to `backend/schemas/group.py`.
  - **Schemas Needed**:
    - `ModuleResponse`
    - `ModuleDetailResponse`
    - `ModuleCreate`
    - `ModuleUpdate`
  - Ensure:
    - Request and response models match route expectations.
    - Validation logic (required vs optional fields) is consistent with business rules.

### 5. Routes & Business Logic (Ellie)

- **File**: `backend/routes/modules.py`
- **Responsibilities**:
  - Implement all 5 Module endpoints listed above.
  - Enforce authentication/authorization:
    - Require authenticated user for reads.
    - Restrict create/update/delete to admins (or specified roles).
  - Error handling:
    - 404 for missing modules.
    - 401/403 for unauthenticated/unauthorized access (via existing dependencies).
    - 400/422-style errors for validation problems (handled primarily by Pydantic/FastAPI).
  - Use the schemas from `backend/schemas/module.py` consistently for request bodies and responses.

### 6. Authentication & Role-Based Behavior (Ellie & Ethan)

- Use existing starter code patterns:
  - `get_current_active_user` for authenticated access.
  - `require_admin` (or equivalent) for admin-only operations.
  - `security_scheme` in route dependencies for OpenAPI/security integration.
- Ensure:
  - Read operations return only modules the user is allowed to see (e.g., via their courses/groups).
  - Write operations are limited to authorized roles.

### 7. Populate Script (Optional, Connor)

- Update the populate script to:
  - Create sample `Module` instances.
  - Associate modules with courses and posts (if appropriate).
  - Provide realistic sample data to support manual testing and demo.

### 8. Testing Strategy (Ethan)

- **File**: `tests/test_modules.py`
- **Responsibilities**:
  - Contract-level tests for **each** Module endpoint:
    - `GET /api/modules`
    - `GET /api/modules/{id}`
    - `POST /api/modules`
    - `PATCH /api/modules/{id}`
    - `DELETE /api/modules/{id}`
  - For each endpoint:
    - At least **one success test** (happy path).
    - At least **two failure tests**, such as:
      - Unauthorized/unauthenticated access.
      - Resource not found.
      - Invalid payload/validation error.
  - Ensure:
    - Tests match the behavior contracts written in the GitHub issues.
    - Good coverage of role-based behavior and edge cases.

### 9. Process & Workflow

- All HW2 work:
  - Implemented in feature branches.
  - Submitted via PRs.
  - Reviewed by at least one teammate.
  - Merged into `main` only after approval and tests pass.
- Coordination:
  - Use GitHub issues for behavior contracts and tracking tasks.
  - Keep this design document updated if major decisions change.


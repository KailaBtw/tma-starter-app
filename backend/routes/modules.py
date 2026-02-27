"""
Module API endpoints
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from auth import get_current_active_user, require_admin, security_scheme
from database import get_db
from models import (
    CourseModule,
    CourseUser,
    Module,
)
from schemas.module import (
    ModuleCreate,
    ModuleDetailResponse,
    ModuleResponse,
    ModuleUpdate,
)

# File upload functionality removed - students will implement

router = APIRouter(prefix="/modules", tags=["modules"])


# /api/modules 	GET 	List modules accessible to the user
@router.get(
    "",
    response_model=List[ModuleResponse],
    dependencies=[Security(security_scheme)],
)
async def get_modules(
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all modules assigned to the user.
    Admins see all modules.
    """
    # Admins can see all modules
    if current_user.role.name == "admin":
        result = await db.execute(select(Module).order_by(Module.created_at))
        modules = result.scalars().all()
    else:
        # Regular users only see modules assigned them
        # i.e. a user is part of a course, and has all modules for those
        user_groups_result = await db.execute(
            select(CourseUser.course_id).where(CourseUser.user_id == current_user.id)
        )
        course_ids = [row[0] for row in user_groups_result.all()]

        if not course_ids:
            # User is not in any groups, return empty list
            return []

        # Get modules assigned to those courses
        result = await db.execute(
            select(Module)
            .join(CourseModule, Module.id == CourseModule.module_id)
            .where(CourseModule.course_id.in_(course_ids))
            .distinct()
            .order_by(Module.created_at)
        )
        modules = result.scalars().all()

    # File upload functionality removed - students will implement
    module_list = []
    for module in modules:
        module_dict = {
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "color": module.color,
            "created_at": module.created_at,
            "updated_at": module.updated_at,
            "post_count": 0,  # or real count when you wire posts
        }
        module_list.append(module_dict)

    return module_list


# /api/modules/{id} 	GET 	Get a single module
@router.get(
    "/{module_id}",
    response_model=ModuleDetailResponse,
    dependencies=[Security(security_scheme)],
)
async def get_module(
    module_id: int,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single module by ID.
    Admins can get any module. Regular users can only
    get modules from courses they are currently enrolled in.
    """
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()

    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Module not found"
        )

    # Admins can access any module
    if current_user.role.name != "admin":
        # Regular users: only if module is in one of their enrolled courses
        course_ids_result = await db.execute(
            select(CourseUser.course_id).where(CourseUser.user_id == current_user.id)
        )
        course_ids = [row[0] for row in course_ids_result.all()]
        if not course_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Module not found"
            )
        link_result = await db.execute(
            select(CourseModule)
            .where(CourseModule.module_id == module_id)
            .where(CourseModule.course_id.in_(course_ids))
        )
        if link_result.scalars().first() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Module not found"
            )

    return module


# /api/modules 	POST 	Create a new module
@router.post(
    "",
    response_model=ModuleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Security(security_scheme)],
)
async def create_module(
    module_data: ModuleCreate,
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new module. Admin only.
    File upload functionality will be implemented by students.
    """
    try:
        module = Module(
            title=module_data.title.strip(),
            description=(
                module_data.description.strip() if module_data.description else None
            ),
            color=(module_data.color.strip() if module_data.color else None),
        )
        db.add(module)
        await db.commit()
        await db.refresh(module)

        if (module_data.course_id): 
            course_module = CourseModule(
            course_id=module_data.course_id, module_id=module.id 
            )
            db.add(course_module)
            await db.commit()
            await db.refresh(course_module)
        
   

        return {
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "color": module.color,
            "created_at": module.created_at,
            "updated_at": module.updated_at,
            "post_count": 0,  # Posts will be implemented by students
            "course_id": module_data.course_id,
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create module: {str(e)}",
        )


# /api/modules/{id} 	PATCH 	Update a module
@router.patch(
    "/{module_id}",
    response_model=ModuleResponse,
    dependencies=[Security(security_scheme)],
)
async def update_module(
    module_id: int,
    module_data: ModuleUpdate,
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a module. Admin only.
    """
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()

    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Module not found"
        )

    # Update basic fields
    if module_data.title is not None:
        module.title = module_data.title.strip()
    if module_data.description is not None:
        module.description = (
            module_data.description.strip() if module_data.description else None
        )
    if module_data.color is not None:
        module.color = module_data.color.strip() if module_data.description else None

    # File upload functionality will be implemented by students

    await db.commit()
    await db.refresh(module)

    return {
        "id": module.id,
        "title": module.title,
        "description": module.description,
        "color": module.color,
        "created_at": module.created_at,
        "updated_at": module.updated_at,
        "post_count": 0,  # Posts will be implemented by students
    }


# /api/modules/{id} 	DELETE 	Delete a module
@router.delete(
    "/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(security_scheme)],
)
async def delete_module(
    module_id: int,
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a module. Admin only.
    Deletes both the module record and the associated file.
    """
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()

    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Module not found"
        )

    # File deletion will be implemented by students when file upload is added

    # Delete the Module
    await db.delete(module)
    await db.commit()
    return None

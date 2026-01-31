"""
Authentication API endpoints
"""

from datetime import timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_current_user_optional,
    get_password_hash,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    require_admin,
    security_scheme,
)
from database import get_db
from models.role import Role
from models.user import User
from schemas.auth import (
    Token,
    UserCreate,
    UserDisableRequest,
    UserLogin,
    UserProfileUpdate,
    UserResponse,
    UserRoleChangeRequest,
)

# Email service removed - email verification simplified for starter code

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Register a new user.

    By default, new users are created with the 'user' role.
    Only admins can create users with other roles (handled separately if needed).
    """
    # Sanitize input - strip whitespace and control characters
    username = user_data.username.strip()
    email = user_data.email.strip()
    password = user_data.password.strip()

    # Validate that fields are not empty after stripping
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty",
        )
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email cannot be empty",
        )
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password cannot be empty",
        )

    # Validate and get role
    role_name = (
        user_data.role.lower().strip()
        if user_data.role and user_data.role.strip()
        else "user"
    )
    valid_roles = ["admin", "manager", "user"]
    if role_name not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}",
        )

    if role_name in ("admin", "manager"):
        if (
            current_user is None
            or current_user.role is None
            or current_user.role.name != "admin"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can create accounts with admin or manager role.",
            )

    # Get role from database
    role_result = await db.execute(select(Role).where(Role.name == role_name))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Role '{role_name}' not found in database",
        )

    # Check if username already exists
    existing_user = await get_user_by_username(username, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # Check if email already exists
    existing_email = await get_user_by_email(email, db)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(password)
    db_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        role_id=role.id,
        email_verified=True,  # Email verification disabled in starter code
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        child_name=user_data.child_name,
        child_sex_assigned_at_birth=user_data.child_sex_assigned_at_birth,
        child_dob=user_data.child_dob,
        avatar_url=user_data.avatar_url,
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    # Reload user with role relationship for proper serialization
    from sqlalchemy.orm import joinedload

    result = await db.execute(
        select(User).where(User.id == db_user.id).options(joinedload(User.role))
    )
    db_user = result.scalar_one()

    return db_user


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Login endpoint that returns a JWT token.

    Send username and password in JSON body.
    """
    user = await authenticate_user(login_data.username, login_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact an administrator.",
        )

    # Email verification check removed in starter code

    # Ensure role is loaded
    if user.role is None:
        # Load role if not already loaded
        from sqlalchemy.orm import joinedload

        result = await db.execute(
            select(User).where(User.id == user.id).options(joinedload(User.role))
        )
        user = result.scalar_one()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "role": user.role.name},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserResponse,
    dependencies=[Security(security_scheme)],
)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the current authenticated user's information.

    Requires Bearer token authentication.
    """
    return current_user


# Email verification endpoint removed - email verification disabled in starter code


@router.get(
    "/users",
    response_model=List[UserResponse],
    dependencies=[Security(security_scheme)],
)
async def get_all_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all users in the system.

    Requires admin role.
    """
    # Get all users with role relationship loaded
    result = await db.execute(
        select(User).options(joinedload(User.role)).order_by(User.created_at)
    )
    users = result.unique().scalars().all()
    return users


@router.patch("/users/disable", response_model=UserResponse)
async def disable_user(
    request: UserDisableRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Disable or enable a user account.

    Requires admin role.
    """
    # Get the user to disable/enable
    user = await get_user_by_id(request.user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent disabling yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot disable your own account",
        )

    # Update the user's active status
    user.is_active = request.is_active
    await db.commit()
    await db.refresh(user)

    # Reload with role relationship
    result = await db.execute(
        select(User).where(User.id == user.id).options(joinedload(User.role))
    )
    user = result.scalar_one()

    return user


@router.patch("/users/role", response_model=UserResponse)
async def change_user_role(
    request: UserRoleChangeRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Change a user's role.

    Requires admin role.
    """
    # Validate role name
    role_name = request.role.lower().strip()
    valid_roles = ["admin", "manager", "user"]
    if role_name not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}",
        )

    # Get the role from database
    role_result = await db.execute(select(Role).where(Role.name == role_name))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Role '{role_name}' not found in database",
        )

    # Get the user to update
    user = await get_user_by_id(request.user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent changing your own role
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role",
        )

    # Update the user's role
    user.role_id = role.id
    await db.commit()
    await db.refresh(user)

    # Reload with role relationship
    result = await db.execute(
        select(User).where(User.id == user.id).options(joinedload(User.role))
    )
    user = result.scalar_one()

    return user


@router.patch("/users/{user_id}/profile", response_model=UserResponse)
async def update_user_profile(
    user_id: int,
    profile_data: UserProfileUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a user's profile fields (first_name, last_name, child_name, etc.).

    Requires admin role.
    """
    # Get the user to update
    user = await get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update profile fields if provided
    if profile_data.first_name is not None:
        user.first_name = (
            profile_data.first_name.strip() if profile_data.first_name else None
        )
    if profile_data.last_name is not None:
        user.last_name = (
            profile_data.last_name.strip() if profile_data.last_name else None
        )
    if profile_data.child_name is not None:
        user.child_name = (
            profile_data.child_name.strip() if profile_data.child_name else None
        )
    if profile_data.child_sex_assigned_at_birth is not None:
        user.child_sex_assigned_at_birth = (
            profile_data.child_sex_assigned_at_birth.strip()
            if profile_data.child_sex_assigned_at_birth
            else None
        )
    if profile_data.child_dob is not None:
        user.child_dob = profile_data.child_dob
    if profile_data.avatar_url is not None:
        user.avatar_url = (
            profile_data.avatar_url.strip() if profile_data.avatar_url else None
        )

    await db.commit()
    await db.refresh(user)

    # Reload with role relationship
    result = await db.execute(
        select(User).where(User.id == user.id).options(joinedload(User.role))
    )
    user = result.scalar_one()

    return user


# Password reset endpoints removed - email functionality disabled in starter code

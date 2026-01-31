"""
Authentication utilities: password hashing, JWT tokens, and role-based access control
"""

import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models.user import User

load_dotenv()

# Configuration
BCRYPT_ROUNDS = 12
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security scheme for Swagger UI
security_scheme = HTTPBearer()
optional_bearer = HTTPBearer(auto_error=False)


def _prehash_password(password: str) -> bytes:
    """
    Pre-hash password with SHA256 to handle bcrypt's 72-byte limit.
    Returns 32-byte binary digest (well under bcrypt's limit).
    """
    return hashlib.sha256(password.encode("utf-8")).digest()


def get_password_hash(password: str) -> str:
    """Hash a password using SHA256 + bcrypt"""
    prehashed = _prehash_password(password)
    hashed = bcrypt.hashpw(prehashed, bcrypt.gensalt(rounds=BCRYPT_ROUNDS))
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    prehashed = _prehash_password(plain_password)
    return bcrypt.checkpw(prehashed, hashed_password.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_verification_token(user_id: int, email: str) -> str:
    """Create an email verification token"""
    data = {
        "user_id": user_id,
        "email": email,
        "type": "email_verification",
    }
    # Verification tokens expire in 24 hours
    expires_delta = timedelta(hours=24)
    return create_access_token(data, expires_delta=expires_delta)


def verify_verification_token(token: str) -> Optional[dict]:
    """Verify an email verification token and return the payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "email_verification":
            return None
        return payload
    except JWTError:
        return None


def create_password_reset_token(user_id: int, email: str) -> str:
    """Create a password reset token"""
    data = {
        "user_id": user_id,
        "email": email,
        "type": "password_reset",
    }
    # Password reset tokens expire in 1 hour
    expires_delta = timedelta(hours=1)
    return create_access_token(data, expires_delta=expires_delta)


def verify_password_reset_token(token: str) -> Optional[dict]:
    """Verify a password reset token and return the payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        return payload
    except JWTError:
        return None


async def get_user_by_username(username: str, db: AsyncSession) -> Optional[User]:
    """Get a user by username with role relationship loaded"""
    from sqlalchemy.orm import joinedload

    result = await db.execute(
        select(User).where(User.username == username).options(joinedload(User.role))
    )
    return result.scalar_one_or_none()


async def get_user_by_email(email: str, db: AsyncSession) -> Optional[User]:
    """Get a user by email with role relationship loaded"""
    from sqlalchemy.orm import joinedload

    result = await db.execute(
        select(User).where(User.email == email).options(joinedload(User.role))
    )
    return result.scalar_one_or_none()


async def get_user_by_id(user_id: int, db: AsyncSession) -> Optional[User]:
    """Get a user by ID with role relationship loaded"""
    from sqlalchemy.orm import joinedload

    result = await db.execute(
        select(User).where(User.id == user_id).options(joinedload(User.role))
    )
    return result.scalar_one_or_none()


async def authenticate_user(
    username: str, password: str, db: AsyncSession
) -> Optional[User]:
    """Authenticate a user by username and password"""
    user = await get_user_by_username(username, db)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def get_bearer_token(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
) -> str:
    """Extract Bearer token from Authorization header"""
    return credentials.credentials


async def get_current_user(
    token: str = Depends(get_bearer_token),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get the current authenticated user from JWT token.
    """
    from sqlalchemy.orm import joinedload

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    # Load user with role relationship
    result = await db.execute(
        select(User).where(User.username == username).options(joinedload(User.role))
    )
    authenticated_user = result.scalar_one_or_none()
    if authenticated_user is None:
        raise credentials_exception

    return authenticated_user


async def get_bearer_token_optional(
    credentials: HTTPAuthorizationCredentials | None = Security(optional_bearer),
) -> str | None:
    """Extract Bearer token from Authorization header if present."""
    if credentials is None:
        return None
    return credentials.credentials


async def get_current_user_optional(
    token: str | None = Depends(get_bearer_token_optional),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Get the current user from JWT if present and valid; otherwise None.
    Use for endpoints that work both authenticated and anonymous (e.g. register).
    """
    if token is None:
        return None
    from sqlalchemy.orm import joinedload

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None

    result = await db.execute(
        select(User).where(User.username == username).options(joinedload(User.role))
    )
    return result.scalar_one_or_none()


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get the current active user"""
    return current_user


# Role-based access control dependencies
def require_role(*allowed_roles: str):
    """Factory function that creates a dependency to require specific roles"""

    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        # Ensure role relationship is loaded
        if current_user.role is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User role not found",
            )
        role_name = current_user.role.name
        if role_name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker


async def require_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Dependency to require admin role"""
    if current_user.role is None or current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Required role: admin",
        )
    return current_user


async def require_group_manager(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Dependency to require manager or admin role"""
    if current_user.role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User role not found",
        )
    role_name = current_user.role.name
    if role_name not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Required role: admin or manager",
        )
    return current_user


async def require_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Dependency to require any authenticated user"""
    return current_user

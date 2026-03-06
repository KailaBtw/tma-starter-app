import enum
from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, Enum, Integer, Text
from sqlalchemy.ext.associationproxy import association_proxy

from .base import Base


class PostType(str, enum.Enum):
    """Matches api.ts Post type: 'generic' | 'attachment' | 'video' | 'quiz'."""

    generic = "generic"
    attachment = "attachment"
    video = "video"
    quiz = "quiz"


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    post_type = Column(
        Enum(PostType, native_enum=False), default=PostType.generic, nullable=False
    )

    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Many-to-Many Joins
    modules = association_proxy("module_posts", "modules")
    users_who_completed_post = association_proxy("completed_user_items", "users")

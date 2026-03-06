from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, Integer, Text
from sqlalchemy.ext.associationproxy import association_proxy

from .base import Base

# Table for modules


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(Text, nullable=True)
    ordering = Column(Integer, default=0, nullable=False)

    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Many-to-Many Joins
    courses = association_proxy("course_modules", "courses")
    posts = association_proxy("module_posts", "posts")
    users_who_completed_module = association_proxy("completed_user_items", "users")

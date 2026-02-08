from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, Integer, Text
from sqlalchemy.ext.associationproxy import association_proxy

from .base import Base

# Table for posts


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    title = Column(Text)
    description = Column(Text)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Many-to-Many Joins
    modules = association_proxy("module_posts", "modules")
    users_who_completed_post = association_proxy("completed_user_items", "users")

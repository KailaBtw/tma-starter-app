from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer
from sqlalchemy.orm import backref, relationship

from .base import Base

# FK table for many-to-many relationship between modules and posts


class ModulePost(Base):
    __tablename__ = "module_posts"

    id = Column(Integer, primary_key=True)
    module_id = Column(
        Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    post_id = Column(
        Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False
    )
    ordering = Column(Integer, default=0)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    post = relationship("Post", backref=backref(
            "module_posts",
            cascade="all, delete-orphan",
            passive_deletes=True,
        ),)
    module = relationship(
        "Module",
        backref=backref(
            "module_posts",
            cascade="all, delete-orphan",
            passive_deletes=True,
        ),
    )

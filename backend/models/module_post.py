from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from .base import Base

# FK table for many-to-many relationship between modules and posts


class ModulePost(Base):
    __tablename__ = "module_posts"

    id = Column(Integer, primary_key=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    ordering = Column(Integer, default=0)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    course = relationship("Module", backref="module_posts")
    module = relationship("Post", backref="module_posts")

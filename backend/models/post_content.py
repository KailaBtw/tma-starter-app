from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from .base import Base

# Table for post content


class PostContent(Base):
    __tablename__ = "post_content"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    ordering = Column(Integer, default=0, nullable=False)
    content = Column(Text, nullable=True)
    content_type = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    post = relationship("Post", backref="post_content")

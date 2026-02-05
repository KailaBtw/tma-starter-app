from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from .base import Base

# Table for post content


class PostContent(Base):
    __tablename__ = "post_content"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    order = Column(Integer, default=0)
    content = Column(Text)
    content_type = Column(Text)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    post = relationship("Post", backref="post_content")

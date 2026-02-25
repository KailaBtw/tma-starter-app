from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer
from sqlalchemy.orm import backref, relationship

from .base import Base

# FK table for many-to-many relationship between courses and users


class CourseUser(Base):
    __tablename__ = "course_users"

    id = Column(Integer, primary_key=True)
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    course = relationship(
        "Course",
        backref=backref(
            "course_users",
            cascade="all, delete-orphan",
            passive_deletes=True,
        ),
    )
    user = relationship(
        "User",
        backref=backref(
            "course_users",
            cascade="all, delete-orphan",
            passive_deletes=True,
        ),
    )

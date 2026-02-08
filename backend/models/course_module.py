from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from .base import Base

# FK table for many-to-many relationship between courses and modules


class CourseModule(Base):
    __tablename__ = "course_modules"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    ordering = Column(Integer, default=0)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    course = relationship("Course", backref="course_modules")
    module = relationship("Module", backref="course_modules")

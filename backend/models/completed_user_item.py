from datetime import datetime

from sqlalchemy import TIMESTAMP, CheckConstraint, Column, ForeignKey, Integer
from sqlalchemy.orm import backref, relationship

from .base import Base

# FK table for many-to-many relationship between users and completed items,
# which can be courses, modules, or posts


class CompletedUserItem(Base):
    __tablename__ = "completed_user_items"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))

    completed_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="completed_user_items")
    course = relationship("Course", backref="completed_user_items")
    module = relationship(
        "Module",
        backref=backref(
            "completed_user_items",
            cascade="all, delete-orphan",
            passive_deletes=True,
        ),
    )
    post = relationship("Post", backref="completed_user_items")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            """
            (CASE WHEN course_id IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN module_id IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END) = 1
            """,
            name="exactly_one_completed_item",
        ),
    )

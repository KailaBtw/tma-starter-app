"""
Course Pydantic schemas for request/response validation
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from schemas.module import ModuleResponse


class CourseBase(BaseModel):
    """Base schema with common course fields"""

    title: str
    description: Optional[str] = None
    # File upload fields will be implemented by students


class CourseCreate(CourseBase):
    """Schema for creating a new course"""

    pass


class CourseUpdate(BaseModel):
    """Schema for updating a course"""

    title: Optional[str] = None
    description: Optional[str] = None
    # File upload fields will be implemented by students


class CourseResponse(CourseBase):
    """Schema for course response"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    # module_count: int = 0
    # file_url will be implemented by students when file upload is added


class CourseDetailResponse(CourseResponse):
    """Schema for course detail response with modules"""

    model_config = ConfigDict(from_attributes=True)

    modules: List[ModuleResponse] = []

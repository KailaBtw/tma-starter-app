"""
Post Pydantic schemas for request/response validation
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class PostBase(BaseModel):

    title: str
    description: Optional[str] = None


class PosteCreate(PostBase):
    """Schema for creating a new post"""

    pass


class PostUpdate(BaseModel):
    """Schema for updating a post"""

    title: Optional[str] = None
    description: Optional[str] = None


class PostResponse(PostBase):
    """Schema for post response"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    module_count: int = 0


class PostDetailResponse(PostResponse):
    """Schema for post detail response"""

    model_config = ConfigDict(from_attributes=True)


class ContentInPost(BaseModel):
    """Content information included in post"""

    model_config = ConfigDict(from_attributes=True)

    content_id: int
    content_title: str
    content_description: Optional[str]
    ordering: int


class ModuleDetailResponse(PostResponse):
    """Schema for post detail response with content"""

    model_config = ConfigDict(from_attributes=True)

    contents: List[ContentInPost] = []

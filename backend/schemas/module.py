"""
Module Pydantic schemas for request/response validation
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ModuleBase(BaseModel):

    title: str
    description: Optional[str] = None


class ModuleCreate(ModuleBase):
    """Schema for creating a new module"""

    pass


class ModuleUpdate(BaseModel):
    """Schema for updating a module"""

    title: Optional[str] = None
    description: Optional[str] = None


class ModuleResponse(ModuleBase):
    """Schema for module response"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    module_count: int = 0


class PostInModule(BaseModel):
    """Post information included in module"""

    model_config = ConfigDict(from_attributes=True)

    post_id: int
    post_title: str
    post_description: Optional[str]
    post_color: Optional[str] = None
    ordering: int


class ModuleDetailResponse(ModuleResponse):
    """Schema for module detail response with post"""

    model_config = ConfigDict(from_attributes=True)

    posts: List[PostInModule] = []

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
    # Title is required for create but optional for update.

    title: Optional[str] = None


class ModuleResponse(ModuleBase):
    """Schema for module response"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    # When the Post schema is implemented, can 
    # make this smarter.
    post_count: int = 0


class ModuleDetailResponse(ModuleResponse):
    """Schema for module detail response with post"""
    #TODO: This will eventually include a list of Posts associated
    #with this module.

    model_config = ConfigDict(from_attributes=True)


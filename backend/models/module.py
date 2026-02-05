from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, Integer, Text

from .base import Base

# Table for modules


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True)
    title = Column(Text)
    description = Column(Text)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

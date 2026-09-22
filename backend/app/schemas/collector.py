import uuid

from pydantic import BaseModel


class CollectorCreate(BaseModel):
    name: str
    mobile: str
    is_active: bool = True


class CollectorUpdate(BaseModel):
    name: str | None = None
    mobile: str | None = None
    is_active: bool | None = None


class CollectorResponse(BaseModel):
    id: uuid.UUID
    name: str
    mobile: str
    is_active: bool

    class Config:
        from_attributes = True


class CollectorWithCount(CollectorResponse):
    customer_count: int

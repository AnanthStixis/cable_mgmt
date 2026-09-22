import uuid

from pydantic import BaseModel


class AreaCreate(BaseModel):
    name: str


class AreaResponse(BaseModel):
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True


class AreaWithCount(AreaResponse):
    customer_count: int

import uuid
from decimal import Decimal

from pydantic import BaseModel


class PlanCreate(BaseModel):
    name: str
    amount: Decimal
    is_active: bool = True


class PlanUpdate(BaseModel):
    name: str | None = None
    amount: Decimal | None = None
    is_active: bool | None = None


class PlanResponse(BaseModel):
    id: uuid.UUID
    name: str
    amount: Decimal
    is_active: bool

    class Config:
        from_attributes = True

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator

VALID_METHODS = {"CASH", "UPI", "BANK_TRANSFER", "OTHER"}


class PaymentCreate(BaseModel):
    customer_code: str
    bill_year: int
    bill_month: int
    amount: Decimal
    method: str
    collector_id: uuid.UUID | None = None
    reference_note: str | None = None
    paid_at: datetime | None = None

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        v = v.upper()
        if v not in VALID_METHODS:
            raise ValueError(f"method must be one of {VALID_METHODS}")
        return v


class PaymentResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    customer_code: str
    customer_name: str
    bill_year: int | None = None
    bill_month: int | None = None
    amount: Decimal
    method: str
    paid_at: datetime
    recorded_by_user_id: uuid.UUID
    collector_id: uuid.UUID | None
    reference_note: str | None

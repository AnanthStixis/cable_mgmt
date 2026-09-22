import uuid
from decimal import Decimal

from pydantic import BaseModel


class BillingGenerateRequest(BaseModel):
    year: int
    month: int


class BillingGenerateResponse(BaseModel):
    year: int
    month: int
    bills_created: int
    bills_skipped_existing: int
    customers_skipped_inactive: int


class BillListItem(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    customer_code: str
    customer_name: str
    area_name: str | None = None
    bill_year: int
    bill_month: int
    amount: Decimal
    status: str

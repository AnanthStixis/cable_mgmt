import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class ConnectionInput(BaseModel):
    stb_number: str | None = None
    connection_number: str | None = None


class CustomerCreate(BaseModel):
    name: str
    mobile: str
    alt_mobile: str | None = None
    address: str | None = None
    area_id: uuid.UUID | None = None
    plan_id: uuid.UUID | None = None
    monthly_amount: Decimal
    collector_id: uuid.UUID | None = None
    installation_date: date | None = None
    notes: str | None = None
    connection: ConnectionInput | None = None


class CustomerUpdate(BaseModel):
    name: str | None = None
    mobile: str | None = None
    alt_mobile: str | None = None
    address: str | None = None
    area_id: uuid.UUID | None = None
    plan_id: uuid.UUID | None = None
    monthly_amount: Decimal | None = None
    collector_id: uuid.UUID | None = None
    installation_date: date | None = None
    notes: str | None = None
    stb_number: str | None = None
    connection_number: str | None = None


class PauseRequest(BaseModel):
    pause_start: date
    pause_resume: date | None = None
    reason: str | None = None


class CloseRequest(BaseModel):
    reason: str | None = None


class CustomerListItem(BaseModel):
    id: uuid.UUID
    customer_code: str
    name: str
    mobile: str
    area_name: str | None = None
    plan_name: str | None = None
    collector_name: str | None = None
    monthly_amount: Decimal
    status: str

    class Config:
        from_attributes = True


class CurrentMonthBill(BaseModel):
    bill_year: int
    bill_month: int
    amount: Decimal
    status: str


class CustomerDetail(BaseModel):
    id: uuid.UUID
    customer_code: str
    name: str
    mobile: str
    alt_mobile: str | None
    address: str | None
    area_id: uuid.UUID | None
    area_name: str | None = None
    plan_id: uuid.UUID | None
    plan_name: str | None = None
    monthly_amount: Decimal
    collector_id: uuid.UUID | None
    collector_name: str | None = None
    status: str
    installation_date: date | None
    pause_start: date | None
    pause_resume: date | None
    notes: str | None
    stb_number: str | None = None
    connection_number: str | None = None
    created_at: datetime
    updated_at: datetime
    current_month_bill: CurrentMonthBill | None = None
    total_paid: Decimal = Decimal("0")
    total_pending: Decimal = Decimal("0")

    class Config:
        from_attributes = True

from decimal import Decimal

from pydantic import BaseModel


class RecentPayment(BaseModel):
    customer_code: str
    customer_name: str
    amount: Decimal
    method: str
    paid_at: str


class PendingCustomer(BaseModel):
    customer_code: str
    customer_name: str
    area_name: str | None
    amount: Decimal


class DashboardSummary(BaseModel):
    total_customers: int
    active_customers: int
    paused_customers: int
    closed_customers: int
    paid_this_month: int
    pending_this_month: int
    expected_collection: Decimal
    collected_this_month: Decimal
    pending_amount: Decimal
    today_collection: Decimal
    recent_payments: list[RecentPayment]
    pending_customers: list[PendingCustomer]

from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.customer import (
    STATUS_ACTIVE,
    STATUS_CLOSED,
    STATUS_PAUSED,
    Customer,
)
from app.models.monthly_bill import BILL_PAID, BILL_PENDING, MonthlyBill
from app.models.payment import Payment
from app.schemas.dashboard import DashboardSummary, PendingCustomer, RecentPayment

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month
    today = now.date()

    total_customers = db.query(func.count(Customer.id)).scalar()
    active_customers = db.query(func.count(Customer.id)).filter(Customer.status == STATUS_ACTIVE).scalar()
    paused_customers = db.query(func.count(Customer.id)).filter(Customer.status == STATUS_PAUSED).scalar()
    closed_customers = db.query(func.count(Customer.id)).filter(Customer.status == STATUS_CLOSED).scalar()

    bills_this_month = db.query(MonthlyBill).filter(
        MonthlyBill.bill_year == year, MonthlyBill.bill_month == month
    )
    paid_this_month = bills_this_month.filter(MonthlyBill.status == BILL_PAID).count()
    pending_this_month = bills_this_month.filter(MonthlyBill.status == BILL_PENDING).count()

    expected_collection = db.query(func.coalesce(func.sum(MonthlyBill.amount), 0)).filter(
        MonthlyBill.bill_year == year, MonthlyBill.bill_month == month
    ).scalar()
    pending_amount = db.query(func.coalesce(func.sum(MonthlyBill.amount), 0)).filter(
        MonthlyBill.bill_year == year, MonthlyBill.bill_month == month, MonthlyBill.status == BILL_PENDING
    ).scalar()
    collected_this_month = Decimal(expected_collection) - Decimal(pending_amount)

    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    today_collection = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.paid_at >= today_start, Payment.paid_at <= today_end
    ).scalar()

    recent = (
        db.query(Payment)
        .options(joinedload(Payment.customer))
        .order_by(Payment.paid_at.desc())
        .limit(10)
        .all()
    )
    recent_payments = [
        RecentPayment(
            customer_code=p.customer.customer_code,
            customer_name=p.customer.name,
            amount=p.amount,
            method=p.method,
            paid_at=p.paid_at.isoformat(),
        )
        for p in recent
    ]

    pending_bills = (
        db.query(MonthlyBill)
        .join(Customer, Customer.id == MonthlyBill.customer_id)
        .options(joinedload(MonthlyBill.customer).joinedload(Customer.area))
        .filter(
            MonthlyBill.bill_year == year, MonthlyBill.bill_month == month, MonthlyBill.status == BILL_PENDING
        )
        .order_by(Customer.name)
        .limit(20)
        .all()
    )
    pending_list = [
        PendingCustomer(
            customer_code=b.customer.customer_code,
            customer_name=b.customer.name,
            area_name=b.customer.area.name if b.customer.area else None,
            amount=b.amount,
        )
        for b in pending_bills
    ]

    return DashboardSummary(
        total_customers=total_customers,
        active_customers=active_customers,
        paused_customers=paused_customers,
        closed_customers=closed_customers,
        paid_this_month=paid_this_month,
        pending_this_month=pending_this_month,
        expected_collection=Decimal(expected_collection),
        collected_this_month=collected_this_month,
        pending_amount=Decimal(pending_amount),
        today_collection=Decimal(today_collection),
        recent_payments=recent_payments,
        pending_customers=pending_list,
    )

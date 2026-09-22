import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.models.customer import STATUS_ACTIVE, STATUS_PAUSED, STATUS_PAYMENT_PENDING, Customer
from app.models.monthly_bill import BILL_PENDING, MonthlyBill
from app.services.audit_service import log_action
from app.services.customer_service import change_status

# Statuses eligible for billing: connection is live and expected to pay.
BILLABLE_STATUSES = {STATUS_ACTIVE, STATUS_PAYMENT_PENDING}


def generate_monthly_bills(db: Session, year: int, month: int, *, generated_by_user_id: uuid.UUID) -> dict:
    """Idempotent: re-running for the same year/month skips customers who already have a bill.

    Skips customers who are PAUSED (for the pause window) or CLOSED.
    """
    bills_created = 0
    bills_skipped_existing = 0

    period_start = date(year, month, 1)

    # Auto-reactivate any customer whose pause window has ended by this billing period.
    ended_pauses = (
        db.query(Customer)
        .filter(Customer.status == STATUS_PAUSED, Customer.pause_resume.isnot(None), Customer.pause_resume <= period_start)
        .all()
    )
    for customer in ended_pauses:
        customer.pause_start = None
        customer.pause_resume = None
        change_status(db, customer, STATUS_ACTIVE, changed_by_user_id=generated_by_user_id, reason="Pause window ended")

    customers_skipped_inactive = (
        db.query(Customer)
        .filter(Customer.status.in_({STATUS_PAUSED, "CLOSED"}))
        .count()
    )

    candidates = db.query(Customer).filter(Customer.status.in_(BILLABLE_STATUSES)).all()

    for customer in candidates:
        existing = (
            db.query(MonthlyBill)
            .filter(
                MonthlyBill.customer_id == customer.id,
                MonthlyBill.bill_year == year,
                MonthlyBill.bill_month == month,
            )
            .first()
        )
        if existing:
            bills_skipped_existing += 1
            continue

        db.add(
            MonthlyBill(
                customer_id=customer.id,
                bill_year=year,
                bill_month=month,
                amount=customer.monthly_amount,
                status=BILL_PENDING,
            )
        )
        if customer.status == STATUS_ACTIVE:
            change_status(db, customer, STATUS_PAYMENT_PENDING, changed_by_user_id=generated_by_user_id,
                           reason=f"Bill generated for {year}-{month:02d}")
        bills_created += 1

    log_action(
        db,
        user_id=generated_by_user_id,
        entity_type="billing_run",
        entity_id=None,
        action="generate_monthly_bills",
        new_value={"year": year, "month": month, "bills_created": bills_created},
    )

    return {
        "year": year,
        "month": month,
        "bills_created": bills_created,
        "bills_skipped_existing": bills_skipped_existing,
        "customers_skipped_inactive": customers_skipped_inactive,
    }

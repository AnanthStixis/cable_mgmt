import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import STATUS_ACTIVE, STATUS_PAYMENT_PENDING, Customer
from app.models.monthly_bill import BILL_PAID, BILL_PENDING, MonthlyBill
from app.models.payment import Payment
from app.services.audit_service import log_action
from app.services.customer_service import change_status


def record_payment(
    db: Session,
    *,
    customer: Customer,
    bill_year: int,
    bill_month: int,
    amount,
    method: str,
    recorded_by_user_id: uuid.UUID,
    collector_id: uuid.UUID | None,
    reference_note: str | None,
    paid_at: datetime | None,
) -> Payment:
    bill = (
        db.query(MonthlyBill)
        .filter(
            MonthlyBill.customer_id == customer.id,
            MonthlyBill.bill_year == bill_year,
            MonthlyBill.bill_month == bill_month,
        )
        .first()
    )
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No bill exists for {customer.customer_code} in {bill_year}-{bill_month:02d}. Generate bills first.",
        )
    if bill.status == BILL_PAID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This bill is already marked PAID")

    payment = Payment(
        customer_id=customer.id,
        monthly_bill_id=bill.id,
        amount=amount,
        method=method,
        recorded_by_user_id=recorded_by_user_id,
        collector_id=collector_id,
        paid_at=paid_at or datetime.now(timezone.utc),
        reference_note=reference_note,
    )
    db.add(payment)

    bill.status = BILL_PAID

    # If no other pending bills remain, the connection is fully caught up.
    other_pending = (
        db.query(MonthlyBill)
        .filter(
            MonthlyBill.customer_id == customer.id,
            MonthlyBill.status == BILL_PENDING,
            MonthlyBill.id != bill.id,
        )
        .first()
    )
    if not other_pending and customer.status == STATUS_PAYMENT_PENDING:
        change_status(db, customer, STATUS_ACTIVE, changed_by_user_id=recorded_by_user_id, reason="Fully paid")

    db.flush()

    log_action(
        db,
        user_id=recorded_by_user_id,
        entity_type="payment",
        entity_id=payment.id,
        action="recorded",
        new_value={
            "customer_code": customer.customer_code,
            "amount": str(amount),
            "method": method,
            "bill_year": bill_year,
            "bill_month": bill_month,
        },
    )

    return payment

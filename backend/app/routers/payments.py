from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.customer import Customer
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.payment_service import record_payment

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.customer_code == payload.customer_code).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    payment = record_payment(
        db,
        customer=customer,
        bill_year=payload.bill_year,
        bill_month=payload.bill_month,
        amount=payload.amount,
        method=payload.method,
        recorded_by_user_id=current_user.id,
        collector_id=payload.collector_id,
        reference_note=payload.reference_note,
        paid_at=payload.paid_at,
    )
    db.commit()
    db.refresh(payment)

    return PaymentResponse(
        id=payment.id,
        customer_id=customer.id,
        customer_code=customer.customer_code,
        customer_name=customer.name,
        bill_year=payload.bill_year,
        bill_month=payload.bill_month,
        amount=payment.amount,
        method=payment.method,
        paid_at=payment.paid_at,
        recorded_by_user_id=payment.recorded_by_user_id,
        collector_id=payment.collector_id,
        reference_note=payment.reference_note,
    )


@router.get("", response_model=list[PaymentResponse])
def list_payments(
    customer_code: str | None = Query(None),
    method: str | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Payment).options(joinedload(Payment.customer), joinedload(Payment.monthly_bill))
    if customer_code:
        query = query.join(Customer, Customer.id == Payment.customer_id).filter(
            Customer.customer_code == customer_code
        )
    if method:
        query = query.filter(Payment.method == method.upper())
    if date_from:
        query = query.filter(Payment.paid_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(Payment.paid_at <= datetime.combine(date_to, datetime.max.time()))

    payments = query.order_by(Payment.paid_at.desc()).limit(500).all()
    return [
        PaymentResponse(
            id=p.id,
            customer_id=p.customer_id,
            customer_code=p.customer.customer_code,
            customer_name=p.customer.name,
            bill_year=p.monthly_bill.bill_year if p.monthly_bill else None,
            bill_month=p.monthly_bill.bill_month if p.monthly_bill else None,
            amount=p.amount,
            method=p.method,
            paid_at=p.paid_at,
            recorded_by_user_id=p.recorded_by_user_id,
            collector_id=p.collector_id,
            reference_note=p.reference_note,
        )
        for p in payments
    ]

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.area import Area
from app.models.collector import Collector
from app.models.connection import Connection
from app.models.customer import STATUS_ACTIVE, STATUS_CLOSED, STATUS_PAUSED, Customer
from app.models.monthly_bill import BILL_PENDING, MonthlyBill
from app.models.payment import Payment
from app.models.plan import Plan
from app.models.user import User
from app.schemas.customer import (
    CloseRequest,
    CurrentMonthBill,
    CustomerCreate,
    CustomerDetail,
    CustomerListItem,
    CustomerUpdate,
    PauseRequest,
)
from app.services.audit_service import log_action
from app.services.customer_service import change_status, generate_customer_code

router = APIRouter(prefix="/customers", tags=["customers"])


def _paginated_query(db: Session, search: str | None, area_id, status_filter, plan_id, collector_id):
    query = db.query(Customer)
    if search:
        like = f"%{search}%"
        query = query.outerjoin(Connection, Connection.customer_id == Customer.id).filter(
            or_(
                Customer.customer_code.ilike(like),
                Customer.name.ilike(like),
                Customer.mobile.ilike(like),
                Customer.alt_mobile.ilike(like),
                Customer.address.ilike(like),
                Connection.stb_number.ilike(like),
                Connection.connection_number.ilike(like),
            )
        )
    if area_id:
        query = query.filter(Customer.area_id == area_id)
    if status_filter:
        query = query.filter(Customer.status == status_filter)
    if plan_id:
        query = query.filter(Customer.plan_id == plan_id)
    if collector_id:
        query = query.filter(Customer.collector_id == collector_id)
    return query


def _to_list_item(c: Customer) -> CustomerListItem:
    return CustomerListItem(
        id=c.id,
        customer_code=c.customer_code,
        name=c.name,
        mobile=c.mobile,
        area_name=c.area.name if c.area else None,
        plan_name=c.plan.name if c.plan else None,
        collector_name=c.collector.name if c.collector else None,
        monthly_amount=c.monthly_amount,
        status=c.status,
    )


@router.get("", response_model=list[CustomerListItem])
def list_customers(
    search: str | None = Query(None),
    area_id: uuid.UUID | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    plan_id: uuid.UUID | None = Query(None),
    collector_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = _paginated_query(db, search, area_id, status_filter, plan_id, collector_id).options(
        joinedload(Customer.area), joinedload(Customer.plan), joinedload(Customer.collector)
    )
    customers = query.order_by(Customer.name).offset((page - 1) * page_size).limit(page_size).all()
    return [_to_list_item(c) for c in customers]


@router.post("", response_model=CustomerDetail, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if payload.area_id and not db.query(Area).filter(Area.id == payload.area_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid area_id")
    if payload.plan_id and not db.query(Plan).filter(Plan.id == payload.plan_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan_id")
    if payload.collector_id and not db.query(Collector).filter(Collector.id == payload.collector_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid collector_id")

    customer = Customer(
        customer_code=generate_customer_code(db),
        name=payload.name,
        mobile=payload.mobile,
        alt_mobile=payload.alt_mobile,
        address=payload.address,
        area_id=payload.area_id,
        plan_id=payload.plan_id,
        monthly_amount=payload.monthly_amount,
        collector_id=payload.collector_id,
        installation_date=payload.installation_date,
        notes=payload.notes,
        status=STATUS_ACTIVE,
    )
    db.add(customer)
    db.flush()

    if payload.connection:
        db.add(
            Connection(
                customer_id=customer.id,
                stb_number=payload.connection.stb_number,
                connection_number=payload.connection.connection_number,
            )
        )

    log_action(
        db,
        user_id=current_user.id,
        entity_type="customer",
        entity_id=customer.id,
        action="created",
        new_value={"customer_code": customer.customer_code, "name": customer.name},
    )
    db.commit()
    db.refresh(customer)
    return _to_detail(db, customer)


def _get_customer_or_404(db: Session, customer_code: str) -> Customer:
    customer = (
        db.query(Customer)
        .options(joinedload(Customer.area), joinedload(Customer.plan), joinedload(Customer.collector))
        .filter(Customer.customer_code == customer_code)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


def _to_detail(db: Session, customer: Customer) -> CustomerDetail:
    connection = db.query(Connection).filter(Connection.customer_id == customer.id).first()

    now = datetime.now(timezone.utc)
    current_bill = (
        db.query(MonthlyBill)
        .filter(
            MonthlyBill.customer_id == customer.id,
            MonthlyBill.bill_year == now.year,
            MonthlyBill.bill_month == now.month,
        )
        .first()
    )

    total_paid = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.customer_id == customer.id
    ).scalar()
    total_pending = db.query(func.coalesce(func.sum(MonthlyBill.amount), 0)).filter(
        MonthlyBill.customer_id == customer.id, MonthlyBill.status == BILL_PENDING
    ).scalar()

    return CustomerDetail(
        id=customer.id,
        customer_code=customer.customer_code,
        name=customer.name,
        mobile=customer.mobile,
        alt_mobile=customer.alt_mobile,
        address=customer.address,
        area_id=customer.area_id,
        area_name=customer.area.name if customer.area else None,
        plan_id=customer.plan_id,
        plan_name=customer.plan.name if customer.plan else None,
        monthly_amount=customer.monthly_amount,
        collector_id=customer.collector_id,
        collector_name=customer.collector.name if customer.collector else None,
        status=customer.status,
        installation_date=customer.installation_date,
        pause_start=customer.pause_start,
        pause_resume=customer.pause_resume,
        notes=customer.notes,
        stb_number=connection.stb_number if connection else None,
        connection_number=connection.connection_number if connection else None,
        created_at=customer.created_at,
        updated_at=customer.updated_at,
        current_month_bill=(
            CurrentMonthBill(
                bill_year=current_bill.bill_year,
                bill_month=current_bill.bill_month,
                amount=current_bill.amount,
                status=current_bill.status,
            )
            if current_bill
            else None
        ),
        total_paid=Decimal(total_paid),
        total_pending=Decimal(total_pending),
    )


@router.get("/{customer_code}", response_model=CustomerDetail)
def get_customer(customer_code: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    customer = _get_customer_or_404(db, customer_code)
    return _to_detail(db, customer)


@router.patch("/{customer_code}", response_model=CustomerDetail)
def update_customer(
    customer_code: str,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    customer = _get_customer_or_404(db, customer_code)
    updates = payload.model_dump(exclude_unset=True, exclude={"stb_number", "connection_number"})

    old_values = {k: str(getattr(customer, k)) for k in updates}
    for field, value in updates.items():
        setattr(customer, field, value)

    if payload.stb_number is not None or payload.connection_number is not None:
        connection = db.query(Connection).filter(Connection.customer_id == customer.id).first()
        if not connection:
            connection = Connection(customer_id=customer.id)
            db.add(connection)
        if payload.stb_number is not None:
            connection.stb_number = payload.stb_number
        if payload.connection_number is not None:
            connection.connection_number = payload.connection_number

    if updates:
        log_action(
            db,
            user_id=current_user.id,
            entity_type="customer",
            entity_id=customer.id,
            action="updated",
            old_value=old_values,
            new_value={k: str(v) for k, v in updates.items()},
        )
    db.commit()
    db.refresh(customer)
    return _to_detail(db, customer)


@router.post("/{customer_code}/pause", response_model=CustomerDetail)
def pause_customer(
    customer_code: str,
    payload: PauseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    customer = _get_customer_or_404(db, customer_code)
    if customer.status == STATUS_CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pause a closed connection")

    customer.pause_start = payload.pause_start
    customer.pause_resume = payload.pause_resume
    change_status(db, customer, STATUS_PAUSED, changed_by_user_id=current_user.id, reason=payload.reason)
    db.commit()
    db.refresh(customer)
    return _to_detail(db, customer)


@router.post("/{customer_code}/resume", response_model=CustomerDetail)
def resume_customer(
    customer_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    customer = _get_customer_or_404(db, customer_code)
    if customer.status != STATUS_PAUSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer is not paused")

    customer.pause_start = None
    customer.pause_resume = None
    change_status(db, customer, STATUS_ACTIVE, changed_by_user_id=current_user.id, reason="Resumed")
    db.commit()
    db.refresh(customer)
    return _to_detail(db, customer)


@router.post("/{customer_code}/close", response_model=CustomerDetail)
def close_customer(
    customer_code: str,
    payload: CloseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    customer = _get_customer_or_404(db, customer_code)
    if customer.status == STATUS_CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer already closed")

    change_status(db, customer, STATUS_CLOSED, changed_by_user_id=current_user.id, reason=payload.reason)
    db.commit()
    db.refresh(customer)
    return _to_detail(db, customer)


@router.get("/{customer_code}/payments")
def get_customer_payments(customer_code: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    customer = _get_customer_or_404(db, customer_code)
    payments = (
        db.query(Payment)
        .filter(Payment.customer_id == customer.id)
        .order_by(Payment.paid_at.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "amount": p.amount,
            "method": p.method,
            "paid_at": p.paid_at,
            "reference_note": p.reference_note,
        }
        for p in payments
    ]


@router.get("/{customer_code}/bills")
def get_customer_bills(customer_code: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Month-by-month history: September — Pending, August — Paid (UPI), etc."""
    customer = _get_customer_or_404(db, customer_code)
    bills = (
        db.query(MonthlyBill)
        .filter(MonthlyBill.customer_id == customer.id)
        .order_by(MonthlyBill.bill_year.desc(), MonthlyBill.bill_month.desc())
        .all()
    )
    result = []
    for bill in bills:
        payment = (
            db.query(Payment)
            .filter(Payment.monthly_bill_id == bill.id)
            .order_by(Payment.paid_at.desc())
            .first()
        )
        result.append(
            {
                "bill_year": bill.bill_year,
                "bill_month": bill.bill_month,
                "amount": bill.amount,
                "status": bill.status,
                "payment_method": payment.method if payment else None,
                "paid_at": payment.paid_at if payment else None,
            }
        )
    return result

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.customer import Customer
from app.models.monthly_bill import MonthlyBill
from app.models.user import User
from app.schemas.billing import BillingGenerateRequest, BillingGenerateResponse, BillListItem
from app.services.billing_service import generate_monthly_bills

router = APIRouter(tags=["billing"])


@router.post("/billing/generate", response_model=BillingGenerateResponse)
def generate_bills(
    payload: BillingGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = generate_monthly_bills(db, payload.year, payload.month, generated_by_user_id=current_user.id)
    db.commit()
    return result


@router.get("/bills", response_model=list[BillListItem])
def list_bills(
    year: int = Query(...),
    month: int = Query(...),
    status_filter: str | None = Query(None, alias="status"),
    area_id: uuid.UUID | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = (
        db.query(MonthlyBill)
        .join(Customer, Customer.id == MonthlyBill.customer_id)
        .options(joinedload(MonthlyBill.customer).joinedload(Customer.area))
        .filter(MonthlyBill.bill_year == year, MonthlyBill.bill_month == month)
    )
    if status_filter:
        query = query.filter(MonthlyBill.status == status_filter)
    if area_id:
        query = query.filter(Customer.area_id == area_id)

    bills = query.order_by(Customer.name).all()
    return [
        BillListItem(
            id=b.id,
            customer_id=b.customer_id,
            customer_code=b.customer.customer_code,
            customer_name=b.customer.name,
            area_name=b.customer.area.name if b.customer.area else None,
            bill_year=b.bill_year,
            bill_month=b.bill_month,
            amount=b.amount,
            status=b.status,
        )
        for b in bills
    ]

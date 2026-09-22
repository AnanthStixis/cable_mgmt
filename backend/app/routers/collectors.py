import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.collector import Collector
from app.models.customer import Customer
from app.schemas.collector import CollectorCreate, CollectorUpdate, CollectorWithCount
from app.schemas.customer import CustomerListItem

router = APIRouter(prefix="/collectors", tags=["collectors"])


@router.get("", response_model=list[CollectorWithCount])
def list_collectors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = (
        db.query(Collector, func.count(Customer.id))
        .outerjoin(Customer, Customer.collector_id == Collector.id)
        .group_by(Collector.id)
        .order_by(Collector.name)
        .all()
    )
    return [
        CollectorWithCount(id=c.id, name=c.name, mobile=c.mobile, is_active=c.is_active, customer_count=count)
        for c, count in rows
    ]


@router.post("", response_model=CollectorWithCount, status_code=status.HTTP_201_CREATED)
def create_collector(payload: CollectorCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    collector = Collector(**payload.model_dump())
    db.add(collector)
    db.commit()
    db.refresh(collector)
    return CollectorWithCount(
        id=collector.id, name=collector.name, mobile=collector.mobile, is_active=collector.is_active, customer_count=0
    )


@router.patch("/{collector_id}", response_model=CollectorWithCount)
def update_collector(
    collector_id: uuid.UUID, payload: CollectorUpdate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    collector = db.query(Collector).filter(Collector.id == collector_id).first()
    if not collector:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collector not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(collector, field, value)
    db.commit()
    db.refresh(collector)
    count = db.query(func.count(Customer.id)).filter(Customer.collector_id == collector.id).scalar()
    return CollectorWithCount(
        id=collector.id, name=collector.name, mobile=collector.mobile, is_active=collector.is_active,
        customer_count=count,
    )


@router.get("/{collector_id}/customers", response_model=list[CustomerListItem])
def get_collector_customers(collector_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    collector = db.query(Collector).filter(Collector.id == collector_id).first()
    if not collector:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collector not found")
    return (
        db.query(Customer)
        .filter(Customer.collector_id == collector_id)
        .order_by(Customer.name)
        .all()
    )

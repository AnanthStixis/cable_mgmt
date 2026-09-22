from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.area import Area
from app.models.customer import Customer
from app.schemas.area import AreaCreate, AreaWithCount

router = APIRouter(prefix="/areas", tags=["areas"])


@router.get("", response_model=list[AreaWithCount])
def list_areas(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = (
        db.query(Area, func.count(Customer.id))
        .outerjoin(Customer, Customer.area_id == Area.id)
        .group_by(Area.id)
        .order_by(Area.name)
        .all()
    )
    return [AreaWithCount(id=area.id, name=area.name, customer_count=count) for area, count in rows]


@router.post("", response_model=AreaWithCount, status_code=status.HTTP_201_CREATED)
def create_area(payload: AreaCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(Area).filter(Area.name == payload.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Area already exists")
    area = Area(name=payload.name)
    db.add(area)
    db.commit()
    db.refresh(area)
    return AreaWithCount(id=area.id, name=area.name, customer_count=0)

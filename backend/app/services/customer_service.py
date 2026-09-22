import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.customer import (
    STATUS_ACTIVE,
    STATUS_CLOSED,
    STATUS_PAUSED,
    STATUS_PAYMENT_PENDING,
    Customer,
)
from app.models.customer_status_history import CustomerStatusHistory
from app.services.audit_service import log_action


def generate_customer_code(db: Session) -> str:
    next_val = db.execute(text("SELECT nextval('customer_code_seq')")).scalar()
    return f"CBL{next_val:06d}"


def change_status(
    db: Session,
    customer: Customer,
    new_status: str,
    *,
    changed_by_user_id: uuid.UUID,
    reason: str | None = None,
) -> None:
    old_status = customer.status
    if old_status == new_status:
        return
    customer.status = new_status
    db.add(
        CustomerStatusHistory(
            customer_id=customer.id,
            old_status=old_status,
            new_status=new_status,
            reason=reason,
            changed_by_user_id=changed_by_user_id,
        )
    )
    log_action(
        db,
        user_id=changed_by_user_id,
        entity_type="customer",
        entity_id=customer.id,
        action="status_changed",
        old_value={"status": old_status},
        new_value={"status": new_status, "reason": reason},
    )


VALID_STATUSES = {STATUS_ACTIVE, STATUS_PAYMENT_PENDING, STATUS_PAUSED, STATUS_CLOSED}

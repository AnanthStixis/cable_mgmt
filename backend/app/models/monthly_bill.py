import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin

# Status values: PENDING | PAID | WAIVED | CANCELLED
BILL_PENDING = "PENDING"
BILL_PAID = "PAID"
BILL_WAIVED = "WAIVED"
BILL_CANCELLED = "CANCELLED"


class MonthlyBill(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "monthly_bills"
    __table_args__ = (UniqueConstraint("customer_id", "bill_year", "bill_month", name="uq_customer_bill_month"),)

    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    bill_year: Mapped[int] = mapped_column(Integer, nullable=False)
    bill_month: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=BILL_PENDING, index=True)

    customer: Mapped["Customer"] = relationship(back_populates="monthly_bills")
    payments: Mapped[list["Payment"]] = relationship(back_populates="monthly_bill")

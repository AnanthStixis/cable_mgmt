import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin

# Status values: ACTIVE | PAYMENT_PENDING | TEMPORARILY_PAUSED | CLOSED
STATUS_ACTIVE = "ACTIVE"
STATUS_PAYMENT_PENDING = "PAYMENT_PENDING"
STATUS_PAUSED = "TEMPORARILY_PAUSED"
STATUS_CLOSED = "CLOSED"


class Customer(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "customers"

    customer_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    mobile: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    alt_mobile: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    area_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("areas.id"), nullable=True)
    plan_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=True)
    monthly_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    collector_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("collectors.id"), nullable=True
    )

    status: Mapped[str] = mapped_column(String(30), nullable=False, default=STATUS_ACTIVE, index=True)
    installation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    pause_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    pause_resume: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    area: Mapped["Area"] = relationship(back_populates="customers")
    plan: Mapped["Plan"] = relationship(back_populates="customers")
    collector: Mapped["Collector"] = relationship(back_populates="customers")
    connection: Mapped["Connection"] = relationship(back_populates="customer", uselist=False)
    monthly_bills: Mapped[list["MonthlyBill"]] = relationship(back_populates="customer")
    payments: Mapped[list["Payment"]] = relationship(back_populates="customer")

import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class PaymentLink(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "payment_links"

    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(30), nullable=False, default="MANUAL_UPI")
    upi_intent_string: Mapped[str | None] = mapped_column(Text, nullable=True)
    qr_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    customer: Mapped["Customer"] = relationship()

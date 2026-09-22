import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Connection(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "connections"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), unique=True, nullable=False
    )
    stb_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    connection_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    customer: Mapped["Customer"] = relationship(back_populates="connection")

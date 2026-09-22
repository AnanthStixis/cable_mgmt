from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Area(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "areas"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    customers: Mapped[list["Customer"]] = relationship(back_populates="area")

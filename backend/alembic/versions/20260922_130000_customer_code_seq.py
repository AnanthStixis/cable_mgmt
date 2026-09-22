"""customer code sequence

Revision ID: 20260922_130000
Revises: 20260922_120835
Create Date: 2026-09-22 13:00:00

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260922_130000"
down_revision: Union[str, None] = "20260922_120835"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SEQUENCE customer_code_seq START WITH 1 INCREMENT BY 1")


def downgrade() -> None:
    op.execute("DROP SEQUENCE customer_code_seq")

"""Add stt_provider, structured_output_schema, webhook_url to assistants.

Revision ID: 002_assistant_config
Revises: 001_initial
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_assistant_config'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add STT provider column with default
    op.add_column(
        'assistants',
        sa.Column('stt_provider', sa.String(50), nullable=False, server_default='deepgram')
    )

    # Add structured output schema column (JSON string)
    op.add_column(
        'assistants',
        sa.Column('structured_output_schema', sa.Text(), nullable=True)
    )

    # Add webhook URL column for per-assistant webhooks
    op.add_column(
        'assistants',
        sa.Column('webhook_url', sa.String(500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('assistants', 'webhook_url')
    op.drop_column('assistants', 'structured_output_schema')
    op.drop_column('assistants', 'stt_provider')

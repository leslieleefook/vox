"""Create assistant_tools junction table for many-to-many relationship.

Revision ID: 006_assistant_tools
Revises: 005_tools_credentials
Create Date: 2026-02-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = '006_assistant_tools'
down_revision: Union[str, None] = '005_tools_credentials'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create assistant_tools junction table."""
    op.create_table(
        'assistant_tools',
        sa.Column('assistant_id', UUID(as_uuid=True), sa.ForeignKey('assistants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tool_id', UUID(as_uuid=True), sa.ForeignKey('tools.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('assistant_id', 'tool_id')
    )

    # Create indexes for efficient lookups
    op.create_index('ix_assistant_tools_assistant_id', 'assistant_tools', ['assistant_id'])
    op.create_index('ix_assistant_tools_tool_id', 'assistant_tools', ['tool_id'])


def downgrade() -> None:
    """Drop assistant_tools junction table."""
    op.drop_index('ix_assistant_tools_tool_id', table_name='assistant_tools')
    op.drop_index('ix_assistant_tools_assistant_id', table_name='assistant_tools')
    op.drop_table('assistant_tools')

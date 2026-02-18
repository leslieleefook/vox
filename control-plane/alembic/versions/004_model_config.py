"""Add model configuration fields to assistants.

Revision ID: 004_model_config
Revises: 003_voice_config
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_model_config'
down_revision: Union[str, None] = '003_voice_config'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add llm_provider column (openrouter, openai, anthropic)
    op.add_column(
        'assistants',
        sa.Column('llm_provider', sa.String(50), nullable=False, server_default='openrouter')
    )

    # Add first_message_mode column (assistant-first, user-first, wait-trigger)
    op.add_column(
        'assistants',
        sa.Column('first_message_mode', sa.String(50), nullable=False, server_default='assistant-first')
    )

    # Add temperature column for LLM generation
    op.add_column(
        'assistants',
        sa.Column('temperature', sa.Float(), nullable=False, server_default='0.7')
    )

    # Add max_tokens column for LLM response length
    op.add_column(
        'assistants',
        sa.Column('max_tokens', sa.Integer(), nullable=False, server_default='256')
    )

    # Add rag_file_ids column for RAG file references (future feature)
    op.add_column(
        'assistants',
        sa.Column('rag_file_ids', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('assistants', 'rag_file_ids')
    op.drop_column('assistants', 'max_tokens')
    op.drop_column('assistants', 'temperature')
    op.drop_column('assistants', 'first_message_mode')
    op.drop_column('assistants', 'llm_provider')

"""Add tts_model and tts_is_manual_id to assistants.

Revision ID: 003_voice_config
Revises: 002_assistant_config
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_voice_config'
down_revision: Union[str, None] = '002_assistant_config'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add TTS model column for MiniMax speech model selection
    op.add_column(
        'assistants',
        sa.Column('tts_model', sa.String(100), nullable=False, server_default='speech-02-turbo')
    )

    # Add TTS is_manual_id column for using custom/cloned voice IDs
    op.add_column(
        'assistants',
        sa.Column('tts_is_manual_id', sa.Boolean(), nullable=False, server_default='false')
    )


def downgrade() -> None:
    op.drop_column('assistants', 'tts_is_manual_id')
    op.drop_column('assistants', 'tts_model')

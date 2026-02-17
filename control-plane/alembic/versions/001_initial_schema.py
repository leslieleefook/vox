"""Initial schema with Clients, Assistants, PhoneNumbers, CallLogs.

Revision ID: 001_initial
Revises:
Create Date: 2024-01-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create Clients table
    op.create_table(
        'clients',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('api_key', sa.String(64), unique=True, nullable=False),
        sa.Column('webhook_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create Assistants table
    op.create_table(
        'assistants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('system_prompt', sa.Text(), nullable=False),
        sa.Column('minimax_voice_id', sa.String(50), nullable=False, server_default='mallory'),
        sa.Column('llm_model', sa.String(100), nullable=False, server_default='meta-llama/llama-3.1-70b-instruct'),
        sa.Column('first_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create PhoneNumbers table
    op.create_table(
        'phone_numbers',
        sa.Column('e164_number', sa.String(20), primary_key=True),
        sa.Column('assistant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assistants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('asterisk_context', sa.String(50), nullable=False, server_default='from-external'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_phone_numbers_assistant_id', 'phone_numbers', ['assistant_id'])

    # Create CallLogs table
    op.create_table(
        'call_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assistant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assistants.id', ondelete='SET NULL'), nullable=True),
        sa.Column('phone_number', sa.String(20), nullable=False),
        sa.Column('caller_id', sa.String(20), nullable=False),
        sa.Column('transcript', sa.Text(), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='completed'),
        sa.Column('room_name', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_call_logs_client_id', 'call_logs', ['client_id'])
    op.create_index('ix_call_logs_assistant_id', 'call_logs', ['assistant_id'])
    op.create_index('ix_call_logs_created_at', 'call_logs', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_call_logs_created_at', table_name='call_logs')
    op.drop_index('ix_call_logs_assistant_id', table_name='call_logs')
    op.drop_index('ix_call_logs_client_id', table_name='call_logs')
    op.drop_table('call_logs')

    op.drop_index('ix_phone_numbers_assistant_id', table_name='phone_numbers')
    op.drop_table('phone_numbers')

    op.drop_table('assistants')

    op.drop_table('clients')

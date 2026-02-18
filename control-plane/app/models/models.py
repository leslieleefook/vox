"""SQLAlchemy models for the Vox Control Plane."""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app.database import Base


class Client(Base):
    """Multi-tenant client account."""
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    api_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    assistants: Mapped[list["Assistant"]] = relationship(
        "Assistant",
        back_populates="client",
        cascade="all, delete-orphan"
    )


class Assistant(Base):
    """AI assistant configuration for a client."""
    __tablename__ = "assistants"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    minimax_voice_id: Mapped[str] = mapped_column(String(50), default="mallory")
    llm_model: Mapped[str] = mapped_column(
        String(100),
        default="meta-llama/llama-3.1-70b-instruct"
    )
    stt_provider: Mapped[str] = mapped_column(String(50), default="deepgram")
    structured_output_schema: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    first_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="assistants")
    phone_numbers: Mapped[list["PhoneNumber"]] = relationship(
        "PhoneNumber",
        back_populates="assistant",
        cascade="all, delete-orphan"
    )


class PhoneNumber(Base):
    """Phone number to assistant mapping."""
    __tablename__ = "phone_numbers"

    e164_number: Mapped[str] = mapped_column(
        String(20),
        primary_key=True
    )
    assistant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assistants.id", ondelete="CASCADE"),
        nullable=False
    )
    asterisk_context: Mapped[str] = mapped_column(String(50), default="from-external")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    assistant: Mapped["Assistant"] = relationship("Assistant", back_populates="phone_numbers")

    __table_args__ = (
        Index("ix_phone_numbers_assistant_id", "assistant_id"),
    )


class CallLog(Base):
    """Call transcript and metadata."""
    __tablename__ = "call_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False
    )
    assistant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assistants.id", ondelete="SET NULL"),
        nullable=True
    )
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    caller_id: Mapped[str] = mapped_column(String(20), nullable=False)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="completed")
    room_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_call_logs_client_id", "client_id"),
        Index("ix_call_logs_assistant_id", "assistant_id"),
        Index("ix_call_logs_created_at", "created_at"),
    )

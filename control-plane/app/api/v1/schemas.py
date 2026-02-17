"""Pydantic schemas for API request/response models."""
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Client schemas
class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    webhook_url: Optional[str] = Field(None, max_length=500)


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    webhook_url: Optional[str] = Field(None, max_length=500)


class ClientResponse(ClientBase):
    id: uuid.UUID
    api_key: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Assistant schemas
class AssistantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    system_prompt: str = Field(..., min_length=1)
    minimax_voice_id: str = Field(default="mallory", max_length=50)
    llm_model: str = Field(default="groq/llama-3.1-8b-instant", max_length=100)
    first_message: Optional[str] = None


class AssistantCreate(AssistantBase):
    client_id: uuid.UUID


class AssistantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    system_prompt: Optional[str] = Field(None, min_length=1)
    minimax_voice_id: Optional[str] = Field(None, max_length=50)
    llm_model: Optional[str] = Field(None, max_length=100)
    first_message: Optional[str] = None


class AssistantResponse(AssistantBase):
    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Phone Number schemas
class PhoneNumberBase(BaseModel):
    e164_number: str = Field(..., pattern=r"^\+?[1-9]\d{6,19}$")
    asterisk_context: str = Field(default="from-external", max_length=50)


class PhoneNumberCreate(PhoneNumberBase):
    assistant_id: uuid.UUID


class PhoneNumberResponse(PhoneNumberBase):
    assistant_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Call Log schemas
class CallLogBase(BaseModel):
    phone_number: str
    caller_id: str
    transcript: Optional[str] = None
    latency_ms: Optional[int] = None
    duration_seconds: Optional[int] = None
    status: str = "completed"
    room_name: Optional[str] = None


class CallLogCreate(CallLogBase):
    client_id: uuid.UUID
    assistant_id: Optional[uuid.UUID] = None


class CallLogResponse(CallLogBase):
    id: uuid.UUID
    client_id: uuid.UUID
    assistant_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class CallLogListResponse(BaseModel):
    items: List[CallLogResponse]
    total: int
    page: int
    page_size: int


# Health check
class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    version: str = "1.0.0"

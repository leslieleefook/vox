"""Pydantic schemas for API request/response models."""
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from typing_extensions import Literal


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
    tts_model: str = Field(default="speech-02-turbo", max_length=100)
    tts_is_manual_id: bool = Field(default=False)
    llm_model: str = Field(default="groq/llama-3.1-8b-instant", max_length=100)
    stt_provider: str = Field(default="deepgram", max_length=50)
    structured_output_schema: Optional[str] = Field(None, description="JSON schema for structured output")
    webhook_url: Optional[str] = Field(None, max_length=500, description="Webhook URL for call completion notifications")
    first_message: Optional[str] = None
    # Model Configuration fields
    llm_provider: str = Field(default="openrouter", max_length=50, description="LLM provider: openrouter, openai, anthropic")
    first_message_mode: str = Field(default="assistant-first", max_length=50, description="First message mode: assistant-first, user-first, wait-trigger")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="LLM temperature (0.0-2.0)")
    max_tokens: int = Field(default=256, ge=1, le=32000, description="Maximum tokens in response")
    rag_file_ids: Optional[str] = Field(None, description="Comma-separated file IDs for RAG")


class AssistantCreate(AssistantBase):
    client_id: uuid.UUID
    tool_ids: Optional[List[uuid.UUID]] = Field(None, description="List of tool IDs to associate with the assistant")


class AssistantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    system_prompt: Optional[str] = Field(None, min_length=1)
    minimax_voice_id: Optional[str] = Field(None, max_length=50)
    tts_model: Optional[str] = Field(None, max_length=100)
    tts_is_manual_id: Optional[bool] = None
    llm_model: Optional[str] = Field(None, max_length=100)
    stt_provider: Optional[str] = Field(None, max_length=50)
    structured_output_schema: Optional[str] = Field(None, description="JSON schema for structured output")
    webhook_url: Optional[str] = Field(None, max_length=500, description="Webhook URL for call completion notifications")
    first_message: Optional[str] = None
    # Model Configuration fields
    llm_provider: Optional[str] = Field(None, max_length=50)
    first_message_mode: Optional[str] = Field(None, max_length=50)
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=32000)
    rag_file_ids: Optional[str] = None
    # Tool association
    tool_ids: Optional[List[uuid.UUID]] = Field(None, description="List of tool IDs to associate with the assistant")


class AssistantResponse(AssistantBase):
    id: uuid.UUID
    client_id: uuid.UUID
    tool_ids: List[uuid.UUID] = Field(default_factory=list, description="List of associated tool IDs")
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


# Tool schemas
class ToolBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$",
                      description="Tool function name (alphanumeric, underscore, hyphen only)")
    description: Optional[str] = Field(None, max_length=1000)
    type: str = Field(default="mcp", max_length=20, description="Tool type (mcp or future types)")
    server_config: str = Field(..., description="JSON: {url, timeoutSeconds, credentialId, headers, encryption}")
    mcp_config: str = Field(..., description="JSON: {protocol}")
    messages: Optional[str] = Field(None, description="JSON array: [{trigger, message}]")


class ToolCreate(ToolBase):
    client_id: uuid.UUID


class ToolUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")
    description: Optional[str] = Field(None, max_length=1000)
    type: Optional[str] = Field(None, max_length=20)
    server_config: Optional[str] = None
    mcp_config: Optional[str] = None
    messages: Optional[str] = None


class ToolResponse(ToolBase):
    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ToolListResponse(BaseModel):
    items: List["ToolResponse"]
    total: int
    page: int
    page_size: int


# Credential schemas
class CredentialBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Display name for the credential")
    type: str = Field(..., max_length=50, description="Credential type: bearer, api_key, basic")
    value: str = Field(..., min_length=1, description="The credential value (will be encrypted)")


class CredentialCreate(CredentialBase):
    client_id: uuid.UUID


class CredentialUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, max_length=50)
    value: Optional[str] = Field(None, min_length=1)


class CredentialResponse(BaseModel):
    """Credential response - never includes the encrypted value."""
    id: uuid.UUID
    client_id: uuid.UUID
    name: str
    type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CredentialListResponse(BaseModel):
    items: List[CredentialResponse]
    total: int


# Tool Brief schema for minimal tool info in assistant responses
class ToolBrief(BaseModel):
    """Minimal tool information for assistant responses."""
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True

"""Application configuration using Pydantic Settings."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "postgresql://vox:vox_secret@localhost:5432/vox"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Supabase
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_key: Optional[str] = None

    # LiveKit
    livekit_api_key: Optional[str] = None
    livekit_api_secret: Optional[str] = None

    # AI Services
    openrouter_api_key: Optional[str] = None
    minimax_api_key: Optional[str] = None
    minimax_group_id: Optional[str] = None
    deepgram_api_key: Optional[str] = None

    # SIP Trunking
    sip_trunk_host: Optional[str] = None
    sip_trunk_user: Optional[str] = None
    sip_trunk_secret: Optional[str] = None
    sip_external_host: Optional[str] = None

    # Security
    jwt_secret: str = "dev_jwt_secret_change_in_prod"

    # Application
    app_name: str = "Vox Control Plane"
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

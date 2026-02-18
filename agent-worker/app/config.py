"""Agent Worker configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # Ignore extra fields from .env
    )

    # LiveKit
    livekit_url: str = "ws://livekit:7880"
    livekit_api_key: Optional[str] = None
    livekit_api_secret: Optional[str] = None

    # Redis (for TTS caching)
    redis_url: str = "redis://redis:6379"
    tts_cache_ttl: int = 86400  # 24 hours
    tts_cache_enabled: bool = True

    # AI Services
    openrouter_api_key: Optional[str] = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    minimax_api_key: Optional[str] = None
    minimax_group_id: Optional[str] = None
    minimax_base_url: str = "https://api.minimax.chat/v1"
    deepgram_api_key: Optional[str] = None

    # Control Plane
    control_plane_url: str = "http://control-plane:8000"

    # Pipeline Settings
    sample_rate: int = 16000
    frames_per_buffer: int = 480  # 30ms at 16kHz


settings = Settings()

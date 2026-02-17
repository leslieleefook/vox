"""Agent Worker configuration."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # LiveKit
    livekit_url: str = "ws://livekit:7880"
    livekit_api_key: Optional[str] = None
    livekit_api_secret: Optional[str] = None

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

    class Config:
        env_file = ".env"


settings = Settings()

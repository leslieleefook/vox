"""Minimax TTS service for streaming speech synthesis."""
import asyncio
import struct
from typing import AsyncGenerator, Optional, ClassVar
import httpx
import json
import structlog
from app.config import settings
from app.services.tts_cache import tts_cache

logger = structlog.get_logger()


class MinimaxTTSService:
    """
    Minimax TTS service with streaming PCM output.

    Uses Minimax Speech-01-Turbo for ultra-low latency voice synthesis
    with superior prosody and emotional control.

    Optimizations:
    - HTTP/2 connection pooling for reduced latency
    - Persistent client with keep-alive
    - Pre-warmed connections
    - Redis-based caching for common phrases
    """

    # Shared client pool for connection reuse
    _shared_client: ClassVar[Optional[httpx.AsyncClient]] = None

    def __init__(
        self,
        voice_id: str = "mallory",
        api_key: Optional[str] = None,
        group_id: Optional[str] = None
    ):
        self.voice_id = voice_id
        self.api_key = api_key or settings.minimax_api_key
        self.group_id = group_id or settings.minimax_group_id
        self.base_url = settings.minimax_base_url
        self.sample_rate = settings.sample_rate
        self._own_client = False

    @classmethod
    async def get_shared_client(cls) -> httpx.AsyncClient:
        """Get or create shared HTTP client with connection pooling."""
        if cls._shared_client is None or cls._shared_client.is_closed:
            cls._shared_client = httpx.AsyncClient(
                timeout=30.0,
                http2=True,  # Enable HTTP/2 for multiplexing
                limits=httpx.Limits(
                    max_keepalive_connections=10,
                    keepalive_expiry=30.0
                )
            )
        return cls._shared_client

    @classmethod
    async def close_shared_client(cls):
        """Close the shared HTTP client."""
        if cls._shared_client and not cls._shared_client.is_closed:
            await cls._shared_client.aclose()
            cls._shared_client = None

    async def stream_tts(
        self,
        text: str,
        speed: float = 1.0,
        use_cache: bool = True
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream TTS audio as PCM chunks.

        Checks cache first for common phrases to reduce latency.

        Args:
            text: Text to synthesize
            speed: Speech speed multiplier
            use_cache: Whether to check/use cache (default True)

        Yields:
            PCM audio chunks (16-bit, 16kHz, mono)
        """
        # Check cache first
        if use_cache:
            cached_audio = await tts_cache.get(text, self.voice_id, speed)
            if cached_audio:
                logger.info("TTS cache hit, using cached audio", text_preview=text[:30])
                # Yield cached audio in chunks for consistent interface
                chunk_size = 4096  # ~128ms of audio at 16kHz
                for i in range(0, len(cached_audio), chunk_size):
                    yield cached_audio[i:i + chunk_size]
                return

        payload = {
            "model": "speech-01-turbo",
            "text": text,
            "stream": True,
            "voice_setting": {
                "voice_id": self.voice_id,
                "speed": speed
            },
            "audio_setting": {
                "sample_rate": self.sample_rate,
                "format": "pcm",
                "channel": 1
            }
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        url = f"{self.base_url}/text_to_speech"
        if self.group_id:
            url = f"{self.base_url}/text_to_speech?GroupId={self.group_id}"

        client = await self.get_shared_client()

        # Collect audio for caching if enabled
        audio_collector = [] if use_cache else None

        async with client.stream(
            "POST",
            url,
            json=payload,
            headers=headers
        ) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes():
                if chunk:
                    if audio_collector is not None:
                        audio_collector.append(chunk)
                    # Minimax streams raw PCM data
                    yield chunk

        # Cache the audio if collected
        if audio_collector and use_cache:
            full_audio = b"".join(audio_collector)
            await tts_cache.set(text, self.voice_id, full_audio, speed)
            logger.debug("TTS audio cached", text_preview=text[:30], size=len(full_audio))

    async def synthesize(
        self,
        text: str,
        speed: float = 1.0
    ) -> bytes:
        """
        Synthesize text to audio (non-streaming).

        Args:
            text: Text to synthesize
            speed: Speech speed multiplier

        Returns:
            Complete PCM audio data
        """
        audio_data = b""
        async for chunk in self.stream_tts(text, speed):
            audio_data += chunk
        return audio_data

    async def close(self):
        """Close the HTTP client (no-op for shared client)."""
        # Shared client is managed at class level
        pass


# Factory function
def create_tts_service(voice_id: str = "mallory") -> MinimaxTTSService:
    return MinimaxTTSService(voice_id=voice_id)

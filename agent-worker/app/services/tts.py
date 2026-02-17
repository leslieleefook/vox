"""Minimax TTS service for streaming speech synthesis."""
import asyncio
import struct
from typing import AsyncGenerator, Optional
import httpx
import json
from app.config import settings


class MinimaxTTSService:
    """
    Minimax TTS service with streaming PCM output.

    Uses Minimax Speech-01-Turbo for ultra-low latency voice synthesis
    with superior prosody and emotional control.
    """

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
        self.client = httpx.AsyncClient(timeout=30.0)

    async def stream_tts(
        self,
        text: str,
        speed: float = 1.0
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream TTS audio as PCM chunks.

        Args:
            text: Text to synthesize
            speed: Speech speed multiplier

        Yields:
            PCM audio chunks (16-bit, 16kHz, mono)
        """
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

        async with self.client.stream(
            "POST",
            url,
            json=payload,
            headers=headers
        ) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes():
                if chunk:
                    # Minimax streams raw PCM data
                    yield chunk

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
        """Close the HTTP client."""
        await self.client.aclose()


# Factory function
def create_tts_service(voice_id: str = "mallory") -> MinimaxTTSService:
    return MinimaxTTSService(voice_id=voice_id)

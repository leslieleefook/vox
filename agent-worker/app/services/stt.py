"""Deepgram STT service for streaming speech recognition."""
import asyncio
import json
from typing import AsyncGenerator, Optional, Callable
import websockets
from app.config import settings


class DeepgramSTTService:
    """
    Deepgram STT service with streaming transcription.

    Uses Deepgram Nova-2 for ultra-low latency speech recognition
    with interim results for responsive conversations.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "nova-2",
        language: str = "en-US"
    ):
        self.api_key = api_key or settings.deepgram_api_key
        self.model = model
        self.language = language
        self.sample_rate = settings.sample_rate
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None

    async def connect(self):
        """Establish WebSocket connection to Deepgram."""
        url = (
            f"wss://api.deepgram.com/v1/listen?"
            f"model={self.model}&"
            f"language={self.language}&"
            f"sample_rate={self.sample_rate}&"
            f"encoding=linear16&"
            f"channels=1&"
            f"interim_results=true&"
            f"endpointing=100"
        )

        headers = {"Authorization": f"Token {self.api_key}"}
        self.websocket = await websockets.connect(url, extra_headers=headers)

    async def send_audio(self, audio_chunk: bytes):
        """
        Send audio chunk to Deepgram.

        Args:
            audio_chunk: PCM audio data (16-bit, 16kHz, mono)
        """
        if self.websocket:
            await self.websocket.send(audio_chunk)

    async def receive_transcripts(self) -> AsyncGenerator[dict, None]:
        """
        Receive transcription results.

        Yields:
            Dictionary with 'text', 'is_final', and 'confidence'
        """
        if not self.websocket:
            raise RuntimeError("WebSocket not connected")

        async for message in self.websocket:
            data = json.loads(message)

            if data.get("type") == "Results":
                channel = data.get("channel", {})
                alternatives = channel.get("alternatives", [])

                if alternatives:
                    transcript = alternatives[0]
                    yield {
                        "text": transcript.get("transcript", ""),
                        "is_final": data.get("is_final", False),
                        "confidence": transcript.get("confidence", 0.0),
                        "words": transcript.get("words", [])
                    }

    async def close(self):
        """Close the WebSocket connection."""
        if self.websocket:
            # Send close signal
            await self.websocket.send(json.dumps({"type": "CloseStream"}))
            await self.websocket.close()
            self.websocket = None


# Factory function
def create_stt_service(
    model: str = "nova-2",
    language: str = "en-US"
) -> DeepgramSTTService:
    return DeepgramSTTService(model=model, language=language)

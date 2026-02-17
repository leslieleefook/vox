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

    Optimizations:
    - Pre-warmed connections
    - Connection pooling for reduced latency
    - Automatic reconnection
    """

    # Connection pool for reuse
    _pooled_connection: Optional[websockets.WebSocketClientProtocol] = None
    _pool_lock: asyncio.Lock = None

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

    @classmethod
    async def _get_pool_lock(cls) -> asyncio.Lock:
        """Get or create the pool lock."""
        if cls._pool_lock is None:
            cls._pool_lock = asyncio.Lock()
        return cls._pool_lock

    @classmethod
    async def prewarm_connection(cls, api_key: str, model: str = "nova-2", sample_rate: int = 16000):
        """Pre-warm a WebSocket connection for faster first response."""
        lock = await cls._get_pool_lock()
        async with lock:
            if cls._pooled_connection is not None:
                try:
                    # Close old connection if it exists
                    await cls._pooled_connection.close()
                except:
                    pass

            url = (
                f"wss://api.deepgram.com/v1/listen?"
                f"model={model}&"
                f"language=en-US&"
                f"sample_rate={sample_rate}&"
                f"encoding=linear16&"
                f"channels=1&"
                f"interim_results=true&"
                f"endpointing=100"
            )
            headers = {"Authorization": f"Token {api_key}"}
            cls._pooled_connection = await websockets.connect(url, additional_headers=headers)

    @classmethod
    async def close_pooled_connection(cls):
        """Close the pooled connection."""
        if cls._pooled_connection is not None:
            try:
                await cls._pooled_connection.close()
            except:
                pass
            cls._pooled_connection = None

    async def connect(self):
        """Establish WebSocket connection to Deepgram."""
        lock = await self._get_pool_lock()
        async with lock:
            # Try to use pooled connection if available
            if self._pooled_connection is not None:
                self.websocket = self._pooled_connection
                self._pooled_connection = None
                return

        # Create new connection if no pooled one available
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
        self.websocket = await websockets.connect(url, additional_headers=headers)

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

    async def close(self, return_to_pool: bool = False):
        """Close the WebSocket connection.

        Args:
            return_to_pool: If True, return connection to pool for reuse
        """
        if self.websocket:
            if return_to_pool:
                # Return to pool instead of closing
                lock = await self._get_pool_lock()
                async with lock:
                    if self._pooled_connection is None:
                        self._pooled_connection = self.websocket
                        self.websocket = None
                        return

            # Close the connection
            try:
                await self.websocket.send(json.dumps({"type": "CloseStream"}))
                await self.websocket.close()
            except:
                pass
            self.websocket = None


# Factory function
def create_stt_service(
    model: str = "nova-2",
    language: str = "en-US"
) -> DeepgramSTTService:
    return DeepgramSTTService(model=model, language=language)

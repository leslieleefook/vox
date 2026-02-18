"""TTS Cache service for caching pre-generated speech audio."""
import hashlib
import structlog
from typing import Optional, ClassVar
import redis.asyncio as redis

from app.config import settings

logger = structlog.get_logger()

# Common phrases to pre-warm on startup
COMMON_PHRASES = [
    # Greetings
    "Hello",
    "Hi there",
    "Good morning",
    "Good afternoon",
    "Good evening",
    "Welcome",

    # Acknowledgments
    "I understand",
    "Got it",
    "Sure thing",
    "Of course",
    "Absolutely",
    "Certainly",
    "Right away",

    # Hold/Wait messages
    "One moment please",
    "Please hold",
    "Just a second",
    "Let me check that for you",
    "I'll look into that",

    # Confirmations
    "Yes",
    "No problem",
    "That's correct",
    "Perfect",
    "Great",

    # Clarifications
    "Could you please repeat that?",
    "I didn't catch that",
    "Could you speak a bit slower?",

    # Closings
    "Goodbye",
    "Thank you for calling",
    "Have a great day",
    "Take care",
    "Is there anything else I can help you with?",
]


class TTSCacheService:
    """
    Redis-based cache for TTS audio.

    Uses text hash + voice_id as cache key to enable
    fast lookups for previously generated audio.

    Features:
    - Hash-based cache keys (text + voice_id + speed)
    - TTL-based eviction
    - Pre-warming of common phrases
    - Graceful degradation if Redis unavailable
    """

    _instance: ClassVar[Optional["TTSCacheService"]] = None
    _client: Optional[redis.Redis] = None
    _prefix: str = "vox:tts:"

    def __new__(cls):
        """Singleton pattern for shared cache instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def enabled(self) -> bool:
        """Check if caching is enabled."""
        return settings.tts_cache_enabled

    async def connect(self):
        """Initialize Redis connection."""
        if self._client is not None:
            return

        try:
            self._client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=False  # Store raw bytes for audio
            )
            # Test connection
            await self._client.ping()
            logger.info("TTS cache connected to Redis")
        except Exception as e:
            logger.warning("TTS cache Redis connection failed, caching disabled", error=str(e))
            self._client = None

    async def disconnect(self):
        """Close Redis connection."""
        if self._client:
            await self._client.close()
            self._client = None

    def _make_key(self, text: str, voice_id: str, speed: float = 1.0) -> str:
        """Generate cache key from text, voice, and speed."""
        # Normalize text
        normalized = text.strip().lower()

        # Create hash of text + voice + speed
        content = f"{normalized}:{voice_id}:{speed}"
        hash_key = hashlib.sha256(content.encode()).hexdigest()[:16]

        return f"{self._prefix}{voice_id}:{hash_key}"

    async def get(
        self,
        text: str,
        voice_id: str,
        speed: float = 1.0
    ) -> Optional[bytes]:
        """
        Get cached TTS audio if available.

        Args:
            text: Text that was synthesized
            voice_id: Voice identifier
            speed: Speech speed multiplier

        Returns:
            Cached PCM audio data or None if not found
        """
        if not self.enabled or not self._client:
            return None

        try:
            key = self._make_key(text, voice_id, speed)
            data = await self._client.get(key)

            if data:
                logger.debug("TTS cache hit", text_preview=text[:30])
                return data

            logger.debug("TTS cache miss", text_preview=text[:30])
            return None

        except Exception as e:
            logger.warning("TTS cache get failed", error=str(e))
            return None

    async def set(
        self,
        text: str,
        voice_id: str,
        audio_data: bytes,
        speed: float = 1.0,
        ttl: Optional[int] = None
    ):
        """
        Cache TTS audio data.

        Args:
            text: Text that was synthesized
            voice_id: Voice identifier
            audio_data: PCM audio bytes
            speed: Speech speed multiplier
            ttl: Time-to-live in seconds (default from settings)
        """
        if not self.enabled or not self._client:
            return

        try:
            key = self._make_key(text, voice_id, speed)
            ttl = ttl or settings.tts_cache_ttl

            await self._client.setex(key, ttl, audio_data)
            logger.debug("TTS cached", text_preview=text[:30], size_bytes=len(audio_data))

        except Exception as e:
            logger.warning("TTS cache set failed", error=str(e))

    async def invalidate(self, text: str, voice_id: str, speed: float = 1.0):
        """Remove specific entry from cache."""
        if not self._client:
            return

        try:
            key = self._make_key(text, voice_id, speed)
            await self._client.delete(key)
        except Exception as e:
            logger.warning("TTS cache invalidate failed", error=str(e))

    async def clear_all(self):
        """Clear all TTS cache entries."""
        if not self._client:
            return

        try:
            # Find all TTS cache keys
            pattern = f"{self._prefix}*"
            cursor = 0
            deleted = 0

            while True:
                cursor, keys = await self._client.scan(cursor, match=pattern, count=100)
                if keys:
                    await self._client.delete(*keys)
                    deleted += len(keys)
                if cursor == 0:
                    break

            logger.info("TTS cache cleared", entries_deleted=deleted)

        except Exception as e:
            logger.warning("TTS cache clear failed", error=str(e))

    async def get_stats(self) -> dict:
        """Get cache statistics."""
        if not self._client:
            return {"enabled": False, "connected": False}

        try:
            # Count TTS cache keys
            pattern = f"{self._prefix}*"
            cursor = 0
            count = 0

            while True:
                cursor, keys = await self._client.scan(cursor, match=pattern, count=100)
                count += len(keys)
                if cursor == 0:
                    break

            return {
                "enabled": self.enabled,
                "connected": True,
                "entries": count,
                "ttl_seconds": settings.tts_cache_ttl
            }

        except Exception as e:
            return {"enabled": self.enabled, "connected": False, "error": str(e)}


# Global singleton instance
tts_cache = TTSCacheService()


async def prewarm_tts_cache(voice_ids: list[str]):
    """
    Pre-warm TTS cache with common phrases.

    This generates TTS audio for frequently used phrases
    to reduce latency during actual conversations.

    Args:
        voice_ids: List of voice IDs to pre-warm
    """
    from app.services.tts import MinimaxTTSService

    logger.info("Pre-warming TTS cache", voices=voice_ids, phrases=len(COMMON_PHRASES))

    for voice_id in voice_ids:
        tts = MinimaxTTSService(voice_id=voice_id)

        for phrase in COMMON_PHRASES:
            # Check if already cached
            cached = await tts_cache.get(phrase, voice_id)
            if cached:
                logger.debug("Phrase already cached", phrase=phrase[:20], voice=voice_id)
                continue

            try:
                # Generate and cache
                audio_data = await tts.synthesize(phrase)
                await tts_cache.set(phrase, voice_id, audio_data)
                logger.debug("Pre-warmed phrase", phrase=phrase[:20], voice=voice_id)

            except Exception as e:
                logger.warning(
                    "Failed to pre-warm phrase",
                    phrase=phrase[:20],
                    voice=voice_id,
                    error=str(e)
                )

    logger.info("TTS cache pre-warming complete")


def get_common_phrases() -> list[str]:
    """Get list of common phrases used for pre-warming."""
    return COMMON_PHRASES.copy()

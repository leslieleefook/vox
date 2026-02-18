"""Tests for TTS cache service."""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import redis.asyncio as redis

from app.services.tts_cache import (
    TTSCacheService,
    tts_cache,
    prewarm_tts_cache,
    get_common_phrases,
    COMMON_PHRASES
)


class TestTTSCacheService:
    """Test cases for TTSCacheService."""

    @pytest.fixture
    def cache_service(self):
        """Create a fresh cache service instance for testing."""
        # Reset singleton for testing
        TTSCacheService._instance = None
        return TTSCacheService()

    def test_singleton_pattern(self, cache_service):
        """Test that TTSCacheService is a singleton."""
        another = TTSCacheService()
        assert cache_service is another

    def test_make_key_generates_consistent_hash(self, cache_service):
        """Test that cache key generation is consistent."""
        key1 = cache_service._make_key("Hello", "mallory", 1.0)
        key2 = cache_service._make_key("Hello", "mallory", 1.0)
        assert key1 == key2

    def test_make_key_different_for_different_text(self, cache_service):
        """Test that different text produces different keys."""
        key1 = cache_service._make_key("Hello", "mallory", 1.0)
        key2 = cache_service._make_key("Goodbye", "mallory", 1.0)
        assert key1 != key2

    def test_make_key_different_for_different_voice(self, cache_service):
        """Test that different voice_id produces different keys."""
        key1 = cache_service._make_key("Hello", "mallory", 1.0)
        key2 = cache_service._make_key("Hello", "wise_male", 1.0)
        assert key1 != key2

    def test_make_key_different_for_different_speed(self, cache_service):
        """Test that different speed produces different keys."""
        key1 = cache_service._make_key("Hello", "mallory", 1.0)
        key2 = cache_service._make_key("Hello", "mallory", 1.2)
        assert key1 != key2

    def test_make_key_normalizes_text(self, cache_service):
        """Test that text normalization works (case, whitespace)."""
        key1 = cache_service._make_key("  Hello World  ", "mallory", 1.0)
        key2 = cache_service._make_key("hello world", "mallory", 1.0)
        key3 = cache_service._make_key("HELLO WORLD", "mallory", 1.0)
        assert key1 == key2 == key3

    def test_key_prefix(self, cache_service):
        """Test that cache keys have correct prefix."""
        key = cache_service._make_key("test", "mallory")
        assert key.startswith("vox:tts:")

    @pytest.mark.asyncio
    async def test_get_returns_none_when_no_client(self, cache_service):
        """Test that get returns None when Redis is not connected."""
        cache_service._client = None
        result = await cache_service.get("Hello", "mallory")
        assert result is None

    @pytest.mark.asyncio
    async def test_set_does_nothing_when_no_client(self, cache_service):
        """Test that set doesn't crash when Redis is not connected."""
        cache_service._client = None
        # Should not raise
        await cache_service.set("Hello", "mallory", b"audio_data")

    @pytest.mark.asyncio
    async def test_get_with_mock_client(self, cache_service):
        """Test get with mocked Redis client."""
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=b"cached_audio_data")
        cache_service._client = mock_client

        result = await cache_service.get("Hello", "mallory")
        assert result == b"cached_audio_data"
        mock_client.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_cache_miss(self, cache_service):
        """Test get when cache entry doesn't exist."""
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=None)
        cache_service._client = mock_client

        result = await cache_service.get("New phrase", "mallory")
        assert result is None

    @pytest.mark.asyncio
    async def test_set_stores_with_ttl(self, cache_service):
        """Test that set stores data with TTL."""
        mock_client = AsyncMock()
        mock_client.setex = AsyncMock()
        cache_service._client = mock_client

        await cache_service.set("Hello", "mallory", b"audio_data", ttl=3600)

        # Verify setex was called with (key, ttl, value)
        mock_client.setex.assert_called_once()
        call_args = mock_client.setex.call_args
        # args[0] = key, args[1] = ttl, args[2] = value
        assert call_args[0][1] == 3600  # TTL
        assert call_args[0][2] == b"audio_data"  # value

    @pytest.mark.asyncio
    async def test_invalidate_deletes_key(self, cache_service):
        """Test that invalidate removes cache entry."""
        mock_client = AsyncMock(spec=redis.Redis)
        cache_service._client = mock_client

        await cache_service.invalidate("Hello", "mallory")

        mock_client.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_stats(self, cache_service):
        """Test get_stats returns correct information."""
        mock_client = AsyncMock()
        mock_client.scan = AsyncMock(return_value=(0, [b"key1", b"key2", b"key3"]))
        cache_service._client = mock_client

        stats = await cache_service.get_stats()

        assert stats["enabled"] is True
        assert stats["connected"] is True
        assert stats["entries"] == 3

    @pytest.mark.asyncio
    async def test_clear_all_deletes_entries(self, cache_service):
        """Test clear_all removes all cache entries."""
        mock_client = AsyncMock()
        mock_client.scan = AsyncMock(side_effect=[
            (3, [b"key1", b"key2"]),
            (0, [b"key3"])
        ])
        mock_client.delete = AsyncMock()
        cache_service._client = mock_client

        await cache_service.clear_all()

        assert mock_client.delete.call_count == 2


class TestCommonPhrases:
    """Test cases for common phrases list."""

    def test_get_common_phrases_returns_list(self):
        """Test that get_common_phrases returns a list."""
        phrases = get_common_phrases()
        assert isinstance(phrases, list)
        assert len(phrases) > 0

    def test_common_phrases_not_empty(self):
        """Test that COMMON_PHRASES is not empty."""
        assert len(COMMON_PHRASES) > 0

    def test_common_phrases_contain_greetings(self):
        """Test that common phrases include greetings."""
        assert any("hello" in p.lower() for p in COMMON_PHRASES)

    def test_common_phrases_contain_closings(self):
        """Test that common phrases include closings."""
        assert any("goodbye" in p.lower() for p in COMMON_PHRASES)

    def test_get_common_phrases_returns_copy(self):
        """Test that get_common_phrases returns a copy."""
        phrases1 = get_common_phrases()
        phrases2 = get_common_phrases()
        phrases1.append("test")
        assert "test" not in phrases2


class TestPrewarmTTSCache:
    """Test cases for TTS cache pre-warming."""

    @pytest.mark.asyncio
    async def test_prewarm_with_empty_voices(self):
        """Test pre-warming with empty voice list."""
        # Should not raise
        await prewarm_tts_cache([])

    @pytest.mark.asyncio
    async def test_prewarm_skips_cached_phrases(self):
        """Test that pre-warming skips already cached phrases."""
        with patch('app.services.tts_cache.tts_cache') as mock_cache:
            mock_cache.get = AsyncMock(return_value=b"cached_data")
            mock_cache.set = AsyncMock()

            # Mock TTS service (imported from app.services.tts in prewarm_tts_cache)
            with patch('app.services.tts.MinimaxTTSService') as mock_tts_class:
                mock_tts_instance = MagicMock()
                mock_tts_instance.synthesize = AsyncMock(return_value=b"audio")
                mock_tts_class.return_value = mock_tts_instance

                await prewarm_tts_cache(["mallory"])

                # synthesize should not be called since cache returns data
                mock_tts_instance.synthesize.assert_not_called()
                # set should not be called since get returns cached data
                mock_cache.set.assert_not_called()


class TestCacheIntegration:
    """Integration tests for TTS caching."""

    @pytest.mark.asyncio
    async def test_cache_disabled_returns_none(self):
        """Test that cache returns None when disabled."""
        with patch('app.services.tts_cache.settings') as mock_settings:
            mock_settings.tts_cache_enabled = False

            TTSCacheService._instance = None
            cache = TTSCacheService()

            result = await cache.get("test", "mallory")
            assert result is None


# Fixtures for async tests
@pytest.fixture
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

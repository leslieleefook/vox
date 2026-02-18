"""Tests for TTS service with caching integration."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.services.tts import MinimaxTTSService, create_tts_service


async def mock_aiter_bytes(chunks):
    """Helper to create async iterator for bytes."""
    for chunk in chunks:
        yield chunk


class TestMinimaxTTSServiceWithCache:
    """Test cases for MinimaxTTSService with caching."""

    @pytest.fixture
    def tts_service(self):
        """Create TTS service for testing."""
        return MinimaxTTSService(voice_id="mallory")

    def test_create_tts_service_factory(self):
        """Test factory function creates service correctly."""
        service = create_tts_service("wise_male")
        assert service.voice_id == "wise_male"

    @pytest.mark.asyncio
    async def test_stream_tts_checks_cache_first(self, tts_service):
        """Test that stream_tts checks cache before API call."""
        with patch('app.services.tts.tts_cache') as mock_cache:
            # Return cached audio
            mock_cache.get = AsyncMock(return_value=b"cached_pcm_audio")

            chunks = []
            async for chunk in tts_service.stream_tts("Hello"):
                chunks.append(chunk)

            # Should get cached data
            assert b"".join(chunks) == b"cached_pcm_audio"
            mock_cache.get.assert_called_once_with("Hello", "mallory", 1.0)

    @pytest.mark.asyncio
    async def test_stream_tts_caches_result(self, tts_service):
        """Test that stream_tts caches API results."""
        with patch('app.services.tts.tts_cache') as mock_cache:
            mock_cache.get = AsyncMock(return_value=None)  # Cache miss
            mock_cache.set = AsyncMock()

            # Mock the HTTP client with proper async context manager
            mock_response = MagicMock()
            mock_response.aiter_bytes = MagicMock(return_value=mock_aiter_bytes([b"chunk1", b"chunk2"]))
            mock_response.raise_for_status = MagicMock()

            mock_client = AsyncMock()
            mock_stream_ctx = AsyncMock()
            mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_response)
            mock_stream_ctx.__aexit__ = AsyncMock(return_value=None)
            mock_client.stream = MagicMock(return_value=mock_stream_ctx)

            with patch.object(
                MinimaxTTSService,
                'get_shared_client',
                AsyncMock(return_value=mock_client)
            ):
                chunks = []
                async for chunk in tts_service.stream_tts("Hello"):
                    chunks.append(chunk)

            # Verify cache.set was called with combined audio
            mock_cache.set.assert_called_once()
            call_args = mock_cache.set.call_args
            assert call_args[0][0] == "Hello"
            assert call_args[0][1] == "mallory"
            assert call_args[0][2] == b"chunk1chunk2"

    @pytest.mark.asyncio
    async def test_stream_tts_skips_cache_when_disabled(self, tts_service):
        """Test that cache can be disabled per-request."""
        with patch('app.services.tts.tts_cache') as mock_cache:
            mock_cache.get = AsyncMock()

            # Mock the HTTP client with proper async context manager
            mock_response = MagicMock()
            mock_response.aiter_bytes = MagicMock(return_value=mock_aiter_bytes([b"chunk1"]))
            mock_response.raise_for_status = MagicMock()

            mock_client = AsyncMock()
            mock_stream_ctx = AsyncMock()
            mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_response)
            mock_stream_ctx.__aexit__ = AsyncMock(return_value=None)
            mock_client.stream = MagicMock(return_value=mock_stream_ctx)

            with patch.object(
                MinimaxTTSService,
                'get_shared_client',
                AsyncMock(return_value=mock_client)
            ):
                async for _ in tts_service.stream_tts("Hello", use_cache=False):
                    pass

            # Cache should not be checked
            mock_cache.get.assert_not_called()

    @pytest.mark.asyncio
    async def test_synthesize_uses_stream_tts(self, tts_service):
        """Test that synthesize uses stream_tts internally."""
        async def mock_stream(text, speed=1.0):
            yield b"chunk1"
            yield b"chunk2"

        with patch.object(
            tts_service,
            'stream_tts',
            side_effect=mock_stream
        ) as mock_stream_method:
            result = await tts_service.synthesize("Test phrase")

            assert result == b"chunk1chunk2"
            mock_stream_method.assert_called_once_with("Test phrase", 1.0)


class TestSharedClient:
    """Test cases for shared HTTP client."""

    @pytest.mark.asyncio
    async def test_get_shared_client_creates_once(self):
        """Test that shared client is created only once."""
        # Reset shared client
        MinimaxTTSService._shared_client = None

        client1 = await MinimaxTTSService.get_shared_client()
        client2 = await MinimaxTTSService.get_shared_client()

        assert client1 is client2

    @pytest.mark.asyncio
    async def test_close_shared_client(self):
        """Test closing shared client."""
        client = await MinimaxTTSService.get_shared_client()
        assert MinimaxTTSService._shared_client is not None

        await MinimaxTTSService.close_shared_client()
        assert MinimaxTTSService._shared_client is None

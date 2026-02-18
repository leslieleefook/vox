"""Pytest configuration and fixtures for agent-worker tests."""
import pytest
import asyncio
import sys
from unittest.mock import MagicMock


# Mock webrtcvad before any imports (Windows doesn't have C++ build tools)
sys.modules['webrtcvad'] = MagicMock()


# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)


def pytest_configure(config):
    """Configure pytest with asyncio mode."""
    config.addinivalue_line(
        "markers", "asyncio: mark test as an asyncio test."
    )


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()

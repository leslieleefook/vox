"""Pytest configuration and fixtures for control plane tests."""
import asyncio
import os
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, Response, Request

# Set test environment variables before importing app
os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test_vox"
os.environ["REDIS_URL"] = "redis://localhost:6379/1"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = AsyncMock()
    return db


@pytest.fixture
def mock_httpx_response():
    """Create a mock httpx response."""
    def _create_response(
        status_code: int = 200,
        text: str = '{"status": "ok"}',
        is_success: bool = True
    ) -> Response:
        response = MagicMock(spec=Response)
        response.status_code = status_code
        response.text = text
        response.is_success = is_success
        return response
    return _create_response


@pytest.fixture
def mock_tool():
    """Create a mock tool object."""
    tool = MagicMock()
    tool.id = "12345678-1234-1234-1234-123456789012"
    tool.client_id = "12345678-1234-1234-1234-123456789013"
    tool.name = "test_tool"
    tool.description = "A test tool"
    tool.type = "mcp"
    tool.server_config = '{"url": "https://api.example.com/test", "timeoutSeconds": 20, "credentialId": null, "headers": []}'
    tool.mcp_config = '{"protocol": "shttp"}'
    tool.messages = None
    return tool


@pytest.fixture
def mock_credential():
    """Create a mock credential object."""
    credential = MagicMock()
    credential.id = "12345678-1234-1234-1234-123456789014"
    credential.client_id = "12345678-1234-1234-1234-123456789013"
    credential.name = "Test API Key"
    credential.type = "bearer"
    credential.value_encrypted = "encrypted_value_here"
    return credential

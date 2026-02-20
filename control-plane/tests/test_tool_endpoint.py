"""Tests for the tool test endpoint."""
import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import HTTPException

from app.api.v1.endpoints import test_tool
from app.api.v1.schemas import ToolTestRequest, ToolTestResponse


class TestToolTestEndpoint:
    """Tests for POST /tools/{tool_id}/test endpoint."""

    @pytest.mark.asyncio
    async def test_test_tool_success(self, mock_db, mock_tool, mock_httpx_response):
        """Test successful tool test request."""
        # Setup
        tool_id = uuid.UUID(mock_tool.id)

        # Mock database query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_tool
        mock_db.execute.return_value = mock_result

        # Mock httpx client
        mock_response = mock_httpx_response(
            status_code=200,
            text='{"result": "success"}',
            is_success=True
        )

        with patch("app.api.v1.endpoints.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client

            # Execute
            result = await test_tool(tool_id, ToolTestRequest(), mock_db)

            # Assert
            assert result.success is True
            assert result.status_code == 200
            assert result.response_time_ms is not None
            assert result.response_body == '{"result": "success"}'
            assert result.error is None

    @pytest.mark.asyncio
    async def test_test_tool_not_found(self, mock_db):
        """Test tool test with non-existent tool."""
        tool_id = uuid.uuid4()

        # Mock database query returning None
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        # Execute and assert
        with pytest.raises(HTTPException) as exc_info:
            await test_tool(tool_id, ToolTestRequest(), mock_db)

        assert exc_info.value.status_code == 404
        assert "Tool not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_test_tool_invalid_server_config(self, mock_db):
        """Test tool with invalid server_config JSON."""
        tool_id = uuid.uuid4()

        # Create tool with invalid JSON
        mock_tool = MagicMock()
        mock_tool.server_config = "not valid json"
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_tool
        mock_db.execute.return_value = mock_result

        # Execute
        result = await test_tool(tool_id, ToolTestRequest(), mock_db)

        # Assert
        assert result.success is False
        assert "Invalid server_config JSON" in result.error
        assert result.error_type == "other"

    @pytest.mark.asyncio
    async def test_test_tool_missing_url(self, mock_db):
        """Test tool with missing URL in server_config."""
        tool_id = uuid.uuid4()

        # Create tool without URL
        mock_tool = MagicMock()
        mock_tool.server_config = '{"timeoutSeconds": 20}'
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_tool
        mock_db.execute.return_value = mock_result

        # Execute
        result = await test_tool(tool_id, ToolTestRequest(), mock_db)

        # Assert
        assert result.success is False
        assert "missing URL" in result.error
        assert result.error_type == "other"

    @pytest.mark.asyncio
    async def test_test_tool_timeout(self, mock_db, mock_tool):
        """Test tool test with timeout error."""
        tool_id = uuid.UUID(mock_tool.id)

        # Mock database query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_tool
        mock_db.execute.return_value = mock_result

        # Mock httpx timeout
        with patch("app.api.v1.endpoints.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post.side_effect = httpx.TimeoutException("Request timed out")
            mock_client_class.return_value = mock_client

            # Execute
            result = await test_tool(tool_id, ToolTestRequest(), mock_db)

            # Assert
            assert result.success is False
            assert "timed out" in result.error.lower()
            assert result.error_type == "timeout"

    @pytest.mark.asyncio
    async def test_test_tool_connection_error(self, mock_db, mock_tool):
        """Test tool test with connection error."""
        tool_id = uuid.UUID(mock_tool.id)

        # Mock database query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_tool
        mock_db.execute.return_value = mock_result

        # Mock httpx connection error
        with patch("app.api.v1.endpoints.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post.side_effect = httpx.ConnectError("Connection refused")
            mock_client_class.return_value = mock_client

            # Execute
            result = await test_tool(tool_id, ToolTestRequest(), mock_db)

            # Assert
            assert result.success is False
            assert "Connection failed" in result.error
            assert result.error_type == "connection"

    @pytest.mark.asyncio
    async def test_test_tool_with_credential_bearer(self, mock_db, mock_tool, mock_credential, mock_httpx_response):
        """Test tool test with bearer credential injection."""
        tool_id = uuid.UUID(mock_tool.id)
        credential_id = str(mock_credential.id)

        # Update tool to use credential
        mock_tool.server_config = json.dumps({
            "url": "https://api.example.com/test",
            "timeoutSeconds": 20,
            "credentialId": credential_id,
            "headers": []
        })

        # Mock database queries
        tool_result = MagicMock()
        tool_result.scalar_one_or_none.return_value = mock_tool

        cred_result = MagicMock()
        cred_result.scalar_one_or_none.return_value = mock_credential

        # Setup execute to return different results based on query
        execute_results = [tool_result, cred_result]
        mock_db.execute.side_effect = execute_results

        # Mock httpx client
        mock_response = mock_httpx_response(status_code=200, text='{"status": "ok"}')

        with patch("app.api.v1.endpoints.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client

            with patch("app.api.v1.endpoints.decrypt_value") as mock_decrypt:
                mock_decrypt.return_value = "test-api-key"

                # Execute
                result = await test_tool(tool_id, ToolTestRequest(), mock_db)

                # Assert credential was decrypted and header was added
                mock_decrypt.assert_called_once_with(mock_credential.value_encrypted)

                # Check that post was called (authorization header would be in the call)
                assert mock_client.post.called

                # Assert successful response
                assert result.success is True

    @pytest.mark.asyncio
    async def test_test_tool_truncates_long_response(self, mock_db, mock_tool, mock_httpx_response):
        """Test that response body is truncated if over 10KB."""
        tool_id = uuid.UUID(mock_tool.id)

        # Mock database query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_tool
        mock_db.execute.return_value = mock_result

        # Create a response larger than 10KB
        large_text = "x" * 15000
        mock_response = mock_httpx_response(
            status_code=200,
            text=large_text,
            is_success=True
        )

        with patch("app.api.v1.endpoints.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client

            # Execute
            result = await test_tool(tool_id, ToolTestRequest(), mock_db)

            # Assert response is truncated
            assert result.success is True
            assert len(result.response_body) < 11000  # 10KB + truncation message
            assert "truncated" in result.response_body

    @pytest.mark.asyncio
    async def test_test_tool_with_parameters(self, mock_db, mock_tool, mock_httpx_response):
        """Test tool test with custom parameters."""
        tool_id = uuid.UUID(mock_tool.id)

        # Mock database query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_tool
        mock_db.execute.return_value = mock_result

        # Mock httpx client
        mock_response = mock_httpx_response(status_code=200, text='{"echo": "test"}')

        with patch("app.api.v1.endpoints.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client

            # Execute with parameters
            test_params = {"query": "test value", "count": 5}
            result = await test_tool(tool_id, ToolTestRequest(parameters=test_params), mock_db)

            # Assert
            assert result.success is True
            # Verify post was called with json parameter
            call_kwargs = mock_client.post.call_args[1]
            assert call_kwargs["json"] == test_params

    @pytest.mark.asyncio
    async def test_test_tool_with_custom_headers(self, mock_db, mock_tool, mock_httpx_response):
        """Test tool test with custom headers from server_config."""
        tool_id = uuid.UUID(mock_tool.id)

        # Update tool with custom headers
        mock_tool.server_config = json.dumps({
            "url": "https://api.example.com/test",
            "timeoutSeconds": 20,
            "credentialId": None,
            "headers": [
                {"key": "X-Custom-Header", "value": "custom-value"},
                {"key": "Content-Type", "value": "application/json"}
            ]
        })

        # Mock database query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_tool
        mock_db.execute.return_value = mock_result

        # Mock httpx client
        mock_response = mock_httpx_response(status_code=200, text='{"status": "ok"}')

        with patch("app.api.v1.endpoints.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client

            # Execute
            result = await test_tool(tool_id, ToolTestRequest(), mock_db)

            # Assert
            assert result.success is True
            # Verify headers were passed to the request
            call_kwargs = mock_client.post.call_args[1]
            assert "headers" in call_kwargs
            headers = call_kwargs["headers"]
            assert headers["X-Custom-Header"] == "custom-value"
            assert headers["Content-Type"] == "application/json"

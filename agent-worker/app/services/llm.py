"""OpenRouter LLM service for streaming text generation."""
import os
from typing import AsyncGenerator, Optional, ClassVar
import httpx
import json
from app.config import settings


class OpenRouterService:
    """
    OpenRouter LLM service with streaming support.

    Uses OpenRouter API to access multiple LLM providers (Groq, Together, etc.)
    with automatic failover and low latency optimization.

    Optimizations:
    - HTTP/2 connection pooling
    - Persistent client with keep-alive
    - Prioritizes fastest providers (Groq)
    """

    # Shared client pool for connection reuse
    _shared_client: ClassVar[Optional[httpx.AsyncClient]] = None

    # Fast models for voice applications
    FAST_MODELS = {
        "llama-8b": "meta-llama/llama-3.1-8b-instruct",
        "llama-70b": "meta-llama/llama-3.1-70b-instruct",
        "groq-llama-8b": "groq/llama-3.1-8b-instant",
        "groq-llama-70b": "groq/llama-3.1-70b-versatile",
    }

    def __init__(
        self,
        model: str = "groq/llama-3.1-8b-instant",
        api_key: Optional[str] = None
    ):
        self.model = model
        self.api_key = api_key or settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url

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

    async def stream_completion(
        self,
        messages: list[dict],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 256
    ) -> AsyncGenerator[str, None]:
        """
        Stream text completion from the LLM.

        Args:
            messages: List of conversation messages
            system_prompt: System prompt for the assistant
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate

        Yields:
            Text chunks as they are generated
        """
        # Build message list
        full_messages = []
        if system_prompt:
            full_messages.append({
                "role": "system",
                "content": system_prompt
            })
        full_messages.extend(messages)

        payload = {
            "model": self.model,
            "messages": full_messages,
            "stream": True,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "transforms": ["middle-out"],  # Optimize for streaming
            "provider": {
                "order": ["Groq", "Together", "OpenAI"],
                "allow_fallbacks": True
            }
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vox.ai",
            "X-Title": "Vox Voice AI"
        }

        client = await self.get_shared_client()
        async with client.stream(
            "POST",
            f"{self.base_url}/chat/completions",
            json=payload,
            headers=headers
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        if chunk.get("choices"):
                            delta = chunk["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                    except json.JSONDecodeError:
                        continue

    async def close(self):
        """Close the HTTP client (no-op for shared client)."""
        # Shared client is managed at class level
        pass


# Factory function for creating service instance
def create_llm_service(
    model: str = "groq/llama-3.1-8b-instant"
) -> OpenRouterService:
    return OpenRouterService(model=model)

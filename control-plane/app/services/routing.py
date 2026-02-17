"""Routing service for phone number to assistant lookup."""
import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import PhoneNumber, Assistant, Client
from app.services.redis_service import redis_service


class RoutingService:
    """Service for routing calls to the correct assistant."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_assistant_for_phone(self, phone_number: str) -> Optional[dict]:
        """
        Look up the assistant configuration for a phone number.

        Args:
            phone_number: E164 formatted phone number (e.g., +18681234567)

        Returns:
            Dictionary with assistant configuration or None
        """
        # Normalize phone number
        normalized = self._normalize_phone(phone_number)

        # Try cache first
        cached = await redis_service.get_assistant_id(normalized)
        if cached:
            config = await redis_service.get_assistant_config(cached)
            if config:
                return config

        # Database lookup
        stmt = (
            select(PhoneNumber, Assistant, Client)
            .join(Assistant, PhoneNumber.assistant_id == Assistant.id)
            .join(Client, Assistant.client_id == Client.id)
            .where(PhoneNumber.e164_number == normalized)
        )
        result = await self.db.execute(stmt)
        row = result.first()

        if not row:
            return None

        phone, assistant, client = row

        config = {
            "assistant_id": str(assistant.id),
            "client_id": str(client.id),
            "name": assistant.name,
            "system_prompt": assistant.system_prompt,
            "minimax_voice_id": assistant.minimax_voice_id,
            "llm_model": assistant.llm_model,
            "first_message": assistant.first_message,
            "webhook_url": client.webhook_url,
        }

        # Cache for future lookups
        await redis_service.set_assistant_id(normalized, str(assistant.id))
        await redis_service.set_assistant_config(str(assistant.id), config)

        return config

    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number to E164 format."""
        # Remove any non-digit characters except leading +
        if phone.startswith("+"):
            return "+" + "".join(c for c in phone[1:] if c.isdigit())
        return "".join(c for c in phone if c.isdigit())

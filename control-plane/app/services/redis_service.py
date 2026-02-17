"""Redis service for caching phone-to-assistant lookups."""
import json
import redis.asyncio as redis
from typing import Optional
from app.config import settings


class RedisService:
    """Redis caching service."""

    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self._prefix = "vox:"

    async def connect(self):
        """Initialize Redis connection."""
        self.client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )

    async def disconnect(self):
        """Close Redis connection."""
        if self.client:
            await self.client.close()

    async def get_assistant_id(self, phone_number: str) -> Optional[str]:
        """Get cached assistant ID for a phone number."""
        if not self.client:
            return None

        key = f"{self._prefix}phone:{phone_number}"
        data = await self.client.get(key)
        if data:
            return json.loads(data).get("assistant_id")
        return None

    async def set_assistant_id(
        self,
        phone_number: str,
        assistant_id: str,
        ttl: int = 3600
    ):
        """Cache assistant ID for a phone number."""
        if not self.client:
            return

        key = f"{self._prefix}phone:{phone_number}"
        data = json.dumps({"assistant_id": assistant_id})
        await self.client.setex(key, ttl, data)

    async def get_assistant_config(self, assistant_id: str) -> Optional[dict]:
        """Get cached assistant configuration."""
        if not self.client:
            return None

        key = f"{self._prefix}assistant:{assistant_id}"
        data = await self.client.get(key)
        if data:
            return json.loads(data)
        return None

    async def set_assistant_config(
        self,
        assistant_id: str,
        config: dict,
        ttl: int = 3600
    ):
        """Cache assistant configuration."""
        if not self.client:
            return

        key = f"{self._prefix}assistant:{assistant_id}"
        await self.client.setex(key, ttl, json.dumps(config))

    async def invalidate_assistant(self, assistant_id: str):
        """Invalidate cached assistant data."""
        if not self.client:
            return

        key = f"{self._prefix}assistant:{assistant_id}"
        await self.client.delete(key)

    async def invalidate_phone(self, phone_number: str):
        """Invalidate cached phone mapping."""
        if not self.client:
            return

        key = f"{self._prefix}phone:{phone_number}"
        await self.client.delete(key)


# Global instance
redis_service = RedisService()

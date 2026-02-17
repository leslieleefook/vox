"""Main entry point for the agent worker."""
import asyncio
import os
import structlog
from livekit.api import RoomServiceClient, CreateRoomRequest

from app.config import settings
from app.pipeline import run_bot
from app.services import DeepgramSTTService, MinimaxTTSService, OpenRouterService

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.dev.ConsoleRenderer()
    ]
)

logger = structlog.get_logger()


async def prewarm_connections():
    """Pre-warm connections to reduce first-request latency."""
    logger.info("Pre-warming connections...")

    # Pre-warm shared HTTP clients
    await MinimaxTTSService.get_shared_client()
    await OpenRouterService.get_shared_client()

    # Pre-warm Deepgram WebSocket connection
    if settings.deepgram_api_key:
        await DeepgramSTTService.prewarm_connection(
            api_key=settings.deepgram_api_key,
            sample_rate=settings.sample_rate
        )

    logger.info("Connections pre-warmed successfully")


class AgentWorker:
    """
    Agent worker that monitors LiveKit rooms and spawns bots.

    In production, this would use webhooks from LiveKit to know
    when new rooms are created. For development, it polls rooms.
    """

    def __init__(self):
        self.livekit_client: Optional[RoomServiceClient] = None
        self.active_bots: dict[str, "VoiceBot"] = {}
        self.is_running = False

    async def start(self):
        """Start the agent worker."""
        logger.info("Starting agent worker")

        # Pre-warm connections for reduced latency
        await prewarm_connections()

        # Initialize LiveKit client
        self.livekit_client = RoomServiceClient(
            settings.livekit_url.replace("ws://", "http://").replace("wss://", "https://"),
            settings.livekit_api_key,
            settings.livekit_api_secret
        )

        self.is_running = True

        # Start polling for rooms
        await self._poll_rooms()

    async def stop(self):
        """Stop the agent worker."""
        logger.info("Stopping agent worker")
        self.is_running = False

        # Stop all active bots
        for room_name, bot in self.active_bots.items():
            logger.info("Stopping bot", room=room_name)
            await bot.stop()

        self.active_bots.clear()

    async def _poll_rooms(self):
        """Poll for new LiveKit rooms."""
        while self.is_running:
            try:
                # List active rooms
                rooms = await self.livekit_client.list_rooms()

                for room in rooms:
                    room_name = room.name

                    # Skip if bot already active
                    if room_name in self.active_bots:
                        continue

                    # Check if this is a call room (starts with "call-")
                    if room_name.startswith("call-"):
                        logger.info("New call room detected", room=room_name)
                        await self._spawn_bot(room_name)

                await asyncio.sleep(5)

            except Exception as e:
                logger.error("Error polling rooms", error=str(e))
                await asyncio.sleep(10)

    async def _spawn_bot(self, room_name: str):
        """Spawn a new bot for a room."""
        logger.info("Spawning bot", room=room_name)

        try:
            # Get assistant config from control plane
            # In production, this would be passed via room metadata
            assistant_config = await self._get_assistant_config(room_name)

            if not assistant_config:
                logger.warning("No assistant config found", room=room_name)
                return

            # Create and start bot
            bot = await run_bot(room_name, assistant_config)
            self.active_bots[room_name] = bot

            logger.info("Bot spawned successfully", room=room_name)

        except Exception as e:
            logger.error("Failed to spawn bot", room=room_name, error=str(e))

    async def _get_assistant_config(self, room_name: str) -> Optional[dict]:
        """Get assistant configuration from control plane."""
        import httpx

        async with httpx.AsyncClient() as client:
            try:
                # Extract assistant ID from room name or metadata
                # Format: call-{assistant_id}-{timestamp}
                parts = room_name.split("-")
                if len(parts) >= 2:
                    assistant_id = parts[1]

                    response = await client.get(
                        f"{settings.control_plane_url}/api/v1/assistants/{assistant_id}"
                    )

                    if response.status_code == 200:
                        data = response.json()
                        return {
                            "assistant_id": data["id"],
                            "system_prompt": data["system_prompt"],
                            "minimax_voice_id": data["minimax_voice_id"],
                            "llm_model": data["llm_model"],
                            "first_message": data.get("first_message")
                        }
            except Exception as e:
                logger.error("Failed to get assistant config", error=str(e))

        return None


async def main():
    """Main entry point."""
    worker = AgentWorker()

    try:
        await worker.start()
    except KeyboardInterrupt:
        await worker.stop()


if __name__ == "__main__":
    asyncio.run(main())

"""FastAGI handler for Asterisk integration."""
import asyncio
import logging
from typing import Dict, Optional
from app.database import async_session_maker
from app.services.routing import RoutingService
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)


class FastAGIServer:
    """
    FastAGI protocol server for Asterisk integration.

    Handles incoming AGI connections from Asterisk and routes calls
    to the appropriate assistant based on the dialed number.
    """

    def __init__(self, host: str = "0.0.0.0", port: int = 4573):
        self.host = host
        self.port = port
        self.server = None

    async def handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Handle incoming AGI connection."""
        addr = writer.get_extra_info('peername')
        logger.info(f"AGI connection from {addr}")

        try:
            # Read AGI environment
            env = await self._read_agi_env(reader)
            logger.debug(f"AGI environment: {env}")

            # Extract key variables
            extension = env.get("agi_extension", "")
            caller_id = env.get("agi_callerid", "unknown")

            logger.info(f"Incoming call: {caller_id} -> {extension}")

            # Look up assistant for this phone number
            assistant_id = await self._route_call(extension)

            if assistant_id:
                # Set the variable for Asterisk dialplan
                await self._set_variable(writer, "VOX_ASSISTANT_ID", assistant_id)
                logger.info(f"Routed call to assistant: {assistant_id}")
            else:
                logger.warning(f"No assistant found for {extension}")
                await self._set_variable(writer, "VOX_ASSISTANT_ID", "")

            # Send AGI end command
            writer.write(b"200 result=0\n")
            await writer.drain()

        except Exception as e:
            logger.error(f"Error handling AGI connection: {e}")
        finally:
            writer.close()
            await writer.wait_closed()

    async def _read_agi_env(self, reader: asyncio.StreamReader) -> Dict[str, str]:
        """Read AGI environment variables from Asterisk."""
        env = {}
        while True:
            line = await reader.readline()
            if not line or line == b"\n":
                break
            line = line.decode("utf-8").strip()
            if ":" in line:
                key, value = line.split(":", 1)
                env[key.strip()] = value.strip()
        return env

    async def _set_variable(self, writer: asyncio.StreamWriter, name: str, value: str):
        """Set a channel variable in Asterisk."""
        command = f'SET VARIABLE {name} "{value}"\n'
        writer.write(command.encode("utf-8"))
        await writer.drain()

    async def _route_call(self, phone_number: str) -> Optional[str]:
        """Look up assistant for phone number."""
        async with async_session_maker() as db:
            routing = RoutingService(db)
            config = await routing.get_assistant_for_phone(phone_number)
            if config:
                return config["assistant_id"]
        return None

    async def start(self):
        """Start the FastAGI server."""
        await redis_service.connect()
        self.server = await asyncio.start_server(
            self.handle_client,
            self.host,
            self.port
        )
        addr = self.server.sockets[0].getsockname()
        logger.info(f"FastAGI server listening on {addr[0]}:{addr[1]}")

        async with self.server:
            await self.server.serve_forever()

    async def stop(self):
        """Stop the FastAGI server."""
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        await redis_service.disconnect()


# Global instance
agi_server = FastAGIServer()

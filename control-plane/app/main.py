"""Main FastAPI application entry point."""
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api import v1_router
from app.api.agi import agi_server

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Vox Control Plane...")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Start AGI server in background
    agi_task = asyncio.create_task(agi_server.start())
    logger.info("FastAGI server started on port 4573")

    yield

    # Cleanup
    logger.info("Shutting down Vox Control Plane...")
    agi_task.cancel()
    try:
        await agi_task
    except asyncio.CancelledError:
        pass
    await agi_server.stop()
    logger.info("Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Vox Control Plane",
    description="AI Voice Telephony Platform - Control Plane API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(v1_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs"
    }

"""Main bot pipeline for voice AI conversation."""
import asyncio
import json
from typing import Optional
import structlog
from livekit import rtc
from livekit.rtc import Room, AudioStream, AudioSource

from app.config import settings
from app.services import (
    create_llm_service, create_tts_service,
    create_stt_service, create_vad_service,
    OpenRouterService, MinimaxTTSService,
    DeepgramSTTService, WebRTCVADService
)
from app.handlers import BargeInHandler, create_barge_in_handler

logger = structlog.get_logger()


class VoiceBot:
    """
    Voice AI bot that handles real-time conversation.

    Orchestrates the full pipeline:
    1. Receive audio from LiveKit room
    2. VAD to detect speech/silence
    3. STT to transcribe user speech
    4. LLM to generate response
    5. TTS to synthesize response
    6. Send audio back to room
    """

    def __init__(
        self,
        room_name: str,
        assistant_id: str,
        system_prompt: str,
        voice_id: str = "mallory",
        llm_model: str = "groq/llama-3.1-8b-instant",
        first_message: Optional[str] = None
    ):
        self.room_name = room_name
        self.assistant_id = assistant_id
        self.system_prompt = system_prompt
        self.voice_id = voice_id
        self.llm_model = llm_model
        self.first_message = first_message

        # Services
        self.llm: Optional[OpenRouterService] = None
        self.tts: Optional[MinimaxTTSService] = None
        self.stt: Optional[DeepgramSTTService] = None
        self.vad: Optional[WebRTCVADService] = None
        self.barge_in: Optional[BargeInHandler] = None

        # LiveKit
        self.room: Optional[Room] = None
        self.audio_source: Optional[AudioSource] = None

        # State
        self.conversation_history: list[dict] = []
        self.is_running = False
        self._audio_queue: asyncio.Queue = asyncio.Queue()

    async def start(self):
        """Initialize services and connect to LiveKit room."""
        logger.info(
            "Starting voice bot",
            room=self.room_name,
            assistant=self.assistant_id
        )

        # Initialize services
        self.llm = create_llm_service(model=self.llm_model)
        self.tts = create_tts_service(voice_id=self.voice_id)
        self.stt = create_stt_service()
        self.vad = create_vad_service(aggressiveness=3)
        self.barge_in = create_barge_in_handler(on_interrupt=self._on_interrupt)

        # Connect to Deepgram
        await self.stt.connect()

        # Connect to LiveKit room
        self.room = Room()
        await self.room.connect(
            settings.livekit_url,
            self._generate_token()
        )
        logger.info("Connected to LiveKit room", room=self.room.name)

        # Set up audio handling
        self._setup_audio()

        # Start processing tasks
        self.is_running = True
        asyncio.create_task(self._process_incoming_audio())
        asyncio.create_task(self._process_transcripts())
        asyncio.create_task(self._play_audio())

        # Send first message if configured
        if self.first_message:
            await self._speak(self.first_message)

    async def stop(self):
        """Stop the bot and cleanup."""
        logger.info("Stopping voice bot")
        self.is_running = False

        if self.stt:
            await self.stt.close()
        if self.llm:
            await self.llm.close()
        if self.tts:
            await self.tts.close()
        if self.room:
            await self.room.disconnect()

    def _generate_token(self) -> str:
        """Generate LiveKit room token."""
        from livekit.api import AccessToken

        token = AccessToken(
            settings.livekit_api_key,
            settings.livekit_api_secret
        )
        token.with_identity(f"bot-{self.assistant_id}")
        token.with_name("Vox Assistant")
        token.with_grants({
            "room_join": True,
            "room": self.room_name,
            "can_publish": True,
            "can_subscribe": True
        })
        return token.to_jwt()

    def _setup_audio(self):
        """Set up audio source and track."""
        self.audio_source = AudioSource(
            sample_rate=settings.sample_rate,
            num_channels=1
        )

        # Publish audio track
        track = rtc.LocalAudioTrack.create_audio_track(
            "assistant-audio",
            self.audio_source
        )
        # Publication would happen here with room.local_participant.publish_track

    async def _process_incoming_audio(self):
        """Process incoming audio from the room."""
        logger.info("Starting incoming audio processing")

        async for audio_stream in AudioStream.create(
            room=self.room,
            track_identity=None  # Listen to all tracks
        ):
            async for frame in audio_stream:
                if not self.is_running:
                    break

                # Get frame data
                audio_data = frame.frame.data

                # Run VAD
                is_speech = self.vad.is_speech(bytes(audio_data))

                # Check for barge-in
                if self.barge_in.process_frame(is_speech):
                    logger.info("Barge-in detected")
                    await self.barge_in.cancel()

                # Send to STT if speech detected
                if is_speech:
                    await self.stt.send_audio(bytes(audio_data))

    async def _process_transcripts(self):
        """Process STT transcripts and generate responses."""
        logger.info("Starting transcript processing")

        async for transcript in self.stt.receive_transcripts():
            if not self.is_running:
                break

            text = transcript["text"]
            is_final = transcript["is_final"]

            if is_final and text.strip():
                logger.info("User said", text=text)
                self.conversation_history.append({
                    "role": "user",
                    "content": text
                })

                # Generate and speak response
                await self._respond(text)

    async def _respond(self, user_input: str):
        """Generate and speak response to user input."""
        logger.info("Generating response")

        full_response = ""
        async for chunk in self.llm.stream_completion(
            messages=self.conversation_history,
            system_prompt=self.system_prompt
        ):
            full_response += chunk

            # Stream to TTS in sentences
            if chunk in ".!?":
                await self._speak(full_response.strip())
                full_response = ""

        # Speak any remaining text
        if full_response.strip():
            await self._speak(full_response.strip())

        # Add to history
        self.conversation_history.append({
            "role": "assistant",
            "content": full_response
        })

    async def _speak(self, text: str):
        """Synthesize and queue audio for playback."""
        if not text:
            return

        logger.info("Speaking", text=text[:50] + "..." if len(text) > 50 else text)

        self.barge_in.start_playback()

        try:
            async for audio_chunk in self.tts.stream_tts(text):
                if self.barge_in.interrupted:
                    break
                await self._audio_queue.put(audio_chunk)
        finally:
            self.barge_in.stop_playback()

    async def _play_audio(self):
        """Play queued audio chunks."""
        while self.is_running:
            try:
                audio_chunk = await asyncio.wait_for(
                    self._audio_queue.get(),
                    timeout=0.1
                )

                if self.audio_source:
                    # Push audio frame to LiveKit
                    frame = rtc.AudioFrame(
                        data=audio_chunk,
                        sample_rate=settings.sample_rate,
                        num_channels=1,
                        samples_per_channel=len(audio_chunk) // 2
                    )
                    await self.audio_source.capture_frame(frame)

            except asyncio.TimeoutError:
                continue

    async def _on_interrupt(self):
        """Handle barge-in interruption."""
        logger.info("Playback interrupted by user")
        # Clear audio queue
        while not self._audio_queue.empty():
            try:
                self._audio_queue.get_nowait()
            except asyncio.QueueEmpty:
                break


async def run_bot(
    room_name: str,
    assistant_config: dict
) -> VoiceBot:
    """
    Create and run a voice bot.

    Args:
        room_name: LiveKit room name
        assistant_config: Assistant configuration from control plane

    Returns:
        Running VoiceBot instance
    """
    bot = VoiceBot(
        room_name=room_name,
        assistant_id=assistant_config["assistant_id"],
        system_prompt=assistant_config["system_prompt"],
        voice_id=assistant_config.get("minimax_voice_id", "mallory"),
        llm_model=assistant_config.get("llm_model", "groq/llama-3.1-8b-instant"),
        first_message=assistant_config.get("first_message")
    )

    await bot.start()
    return bot

"""Barge-in handler for interruption detection."""
import asyncio
from typing import Callable, Optional
from app.services.vad import VADState, create_vad_state


class BargeInHandler:
    """
    Handles barge-in detection during TTS playback.

    Monitors for speech while the bot is speaking and triggers
    cancellation if the user interrupts.
    """

    def __init__(
        self,
        on_interrupt: Optional[Callable] = None,
        silence_threshold_ms: int = 300,
        speech_threshold_ms: int = 100
    ):
        self.on_interrupt = on_interrupt
        self.vad_state = create_vad_state(
            silence_threshold_ms=silence_threshold_ms,
            speech_threshold_ms=speech_threshold_ms
        )
        self.is_playing = False
        self.interrupted = False
        self._cancel_event: Optional[asyncio.Event] = None

    def start_playback(self):
        """Mark playback as started."""
        self.is_playing = True
        self.interrupted = False
        self.vad_state.reset()
        self._cancel_event = asyncio.Event()

    def stop_playback(self):
        """Mark playback as stopped."""
        self.is_playing = False
        if self._cancel_event:
            self._cancel_event.set()

    def process_frame(self, is_speech: bool, frame_duration_ms: int = 30) -> bool:
        """
        Process an audio frame for barge-in detection.

        Args:
            is_speech: Whether speech was detected in this frame
            frame_duration_ms: Frame duration in milliseconds

        Returns:
            True if barge-in was detected
        """
        if not self.is_playing:
            return False

        state = self.vad_state.update(is_speech, frame_duration_ms)

        # Check for speech during playback
        if state["speech_started"] and not self.interrupted:
            self.interrupted = True
            return True

        return False

    async def wait_for_interruption(self, timeout: Optional[float] = None) -> bool:
        """
        Wait for an interruption or completion.

        Args:
            timeout: Maximum time to wait

        Returns:
            True if interrupted, False if completed normally
        """
        if not self._cancel_event:
            return False

        try:
            await asyncio.wait_for(
                self._cancel_event.wait(),
                timeout=timeout
            )
            return self.interrupted
        except asyncio.TimeoutError:
            return False

    async def cancel(self):
        """Cancel current playback."""
        self.interrupted = True
        if self._cancel_event:
            self._cancel_event.set()
        if self.on_interrupt:
            await self.on_interrupt()

    def reset(self):
        """Reset handler state."""
        self.is_playing = False
        self.interrupted = False
        self.vad_state.reset()
        self._cancel_event = None


# Factory function
def create_barge_in_handler(
    on_interrupt: Optional[Callable] = None,
    silence_threshold_ms: int = 300,
    speech_threshold_ms: int = 100
) -> BargeInHandler:
    return BargeInHandler(
        on_interrupt=on_interrupt,
        silence_threshold_ms=silence_threshold_ms,
        speech_threshold_ms=speech_threshold_ms
    )

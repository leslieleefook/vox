"""WebRTC VAD service for silence detection."""
import webrtcvad
from typing import Generator
from app.config import settings


class WebRTCVADService:
    """
    WebRTC Voice Activity Detection.

    Uses WebRTC's VAD algorithm for near-zero latency silence detection.
    Aggressiveness mode 3 provides the most aggressive filtering.
    """

    def __init__(
        self,
        aggressiveness: int = 3,
        frame_duration_ms: int = 30
    ):
        """
        Initialize VAD service.

        Args:
            aggressiveness: VAD aggressiveness (0-3, higher = more aggressive)
            frame_duration_ms: Frame duration in ms (10, 20, or 30)
        """
        self.vad = webrtcvad.Vad(aggressiveness)
        self.frame_duration_ms = frame_duration_ms
        self.sample_rate = settings.sample_rate
        self.frame_size = int(
            self.sample_rate * frame_duration_ms / 1000
        ) * 2  # 2 bytes per sample

    def is_speech(self, audio_frame: bytes) -> bool:
        """
        Check if audio frame contains speech.

        Args:
            audio_frame: PCM audio frame (must be correct size)

        Returns:
            True if speech is detected
        """
        # Pad or truncate frame to exact size
        if len(audio_frame) < self.frame_size:
            audio_frame = audio_frame + b'\x00' * (self.frame_size - len(audio_frame))
        elif len(audio_frame) > self.frame_size:
            audio_frame = audio_frame[:self.frame_size]

        return self.vad.is_speech(audio_frame, self.sample_rate)

    def process_audio(
        self,
        audio_data: bytes
    ) -> Generator[tuple[bytes, bool], None, None]:
        """
        Process audio data and yield frames with speech detection.

        Args:
            audio_data: Complete audio buffer

        Yields:
            Tuples of (frame, is_speech)
        """
        offset = 0
        while offset + self.frame_size <= len(audio_data):
            frame = audio_data[offset:offset + self.frame_size]
            is_speech = self.is_speech(frame)
            yield (frame, is_speech)
            offset += self.frame_size


class VADState:
    """Tracks VAD state for conversation flow."""

    def __init__(
        self,
        silence_threshold_ms: int = 500,
        speech_threshold_ms: int = 100
    ):
        self.silence_threshold_ms = silence_threshold_ms
        self.speech_threshold_ms = speech_threshold_ms
        self.silence_frames = 0
        self.speech_frames = 0
        self.is_speaking = False
        self.speech_started = False

    def update(self, is_speech: bool, frame_duration_ms: int = 30) -> dict:
        """
        Update VAD state with new frame.

        Returns:
            Dictionary with state changes
        """
        result = {
            "speech_started": False,
            "speech_ended": False,
            "is_speaking": self.is_speaking
        }

        if is_speech:
            self.speech_frames += 1
            self.silence_frames = 0

            speech_duration = self.speech_frames * frame_duration_ms
            if not self.is_speaking and speech_duration >= self.speech_threshold_ms:
                self.is_speaking = True
                self.speech_started = True
                result["speech_started"] = True
                result["is_speaking"] = True
        else:
            self.silence_frames += 1

            silence_duration = self.silence_frames * frame_duration_ms
            if self.is_speaking and silence_duration >= self.silence_threshold_ms:
                self.is_speaking = False
                result["speech_ended"] = True
                result["is_speaking"] = False
                self.speech_frames = 0

        return result

    def reset(self):
        """Reset VAD state."""
        self.silence_frames = 0
        self.speech_frames = 0
        self.is_speaking = False
        self.speech_started = False


# Factory functions
def create_vad_service(aggressiveness: int = 3) -> WebRTCVADService:
    return WebRTCVADService(aggressiveness=aggressiveness)


def create_vad_state(
    silence_threshold_ms: int = 500,
    speech_threshold_ms: int = 100
) -> VADState:
    return VADState(
        silence_threshold_ms=silence_threshold_ms,
        speech_threshold_ms=speech_threshold_ms
    )

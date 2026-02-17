#!/usr/bin/env python3
"""
STT Latency Test Script

Measures the streaming transcription latency from Deepgram.
Target: <200ms for interim results.

Usage:
    python scripts/test_stt_latency.py
"""

import asyncio
import time
import os
import sys
import wave
import struct
import math

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent_worker.app.services.stt import DeepgramSTTService


def generate_test_audio(duration_seconds: float = 3.0, sample_rate: int = 16000) -> bytes:
    """Generate a simple test audio tone."""
    samples = int(duration_seconds * sample_rate)
    audio = bytearray()

    for i in range(samples):
        # Generate a simple sine wave at 440Hz
        t = i / sample_rate
        value = int(16000 * math.sin(2 * math.pi * 440 * t))
        # Convert to 16-bit PCM
        audio.extend(struct.pack('<h', value))

    return bytes(audio)


async def test_stt_latency():
    """Test STT connection and basic functionality."""
    api_key = os.getenv("DEEPGRAM_API_KEY")

    if not api_key:
        print("ERROR: DEEPGRAM_API_KEY environment variable not set")
        return

    print("=" * 50)
    print("STT Latency Test")
    print("=" * 50)
    print()

    stt = DeepgramSTTService(api_key=api_key)

    try:
        print("Connecting to Deepgram...")
        start_time = time.perf_counter()
        await stt.connect()
        connect_time = (time.perf_counter() - start_time) * 1000
        print(f"Connected in {connect_time:.1f}ms")
        print()

        print("Sending test audio...")
        test_audio = generate_test_audio(duration_seconds=2.0)

        # Create a task to receive transcripts
        async def receive_transcripts():
            first_result_time = None
            results = []

            async for transcript in stt.receive_transcripts():
                if first_result_time is None:
                    first_result_time = time.perf_counter()

                results.append(transcript)
                print(f"  Received: '{transcript['text'][:50]}...' "
                      f"(final={transcript['is_final']})")

                if len(results) >= 5:  # Wait for a few results
                    break

            return first_result_time, results

        # Send audio and receive transcripts concurrently
        start_time = time.perf_counter()

        async def send_audio():
            # Send audio in chunks to simulate real-time streaming
            chunk_size = 4800  # 150ms at 16kHz
            for i in range(0, len(test_audio), chunk_size):
                chunk = test_audio[i:i + chunk_size]
                await stt.send_audio(chunk)
                await asyncio.sleep(0.1)  # Simulate real-time

        # Run both tasks
        receive_task = asyncio.create_task(receive_transcripts())
        await send_audio()

        first_result_time, results = await receive_task

        if first_result_time:
            latency_ms = (first_result_time - start_time) * 1000
            print()
            print(f"First transcript received in: {latency_ms:.1f}ms")
            print(f"Total transcripts received: {len(results)}")

            if latency_ms < 200:
                print("✓ PASS: Latency is under 200ms target")
            else:
                print("✗ FAIL: Latency exceeds 200ms target")
        else:
            print("ERROR: No transcripts received")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        await stt.close()

    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(test_stt_latency())

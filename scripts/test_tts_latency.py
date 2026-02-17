#!/usr/bin/env python3
"""
TTS Latency Test Script

Measures the time to first audio chunk from Minimax TTS.
Target: <200ms for first chunk.

Usage:
    python scripts/test_tts_latency.py
"""

import asyncio
import time
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent_worker.app.services.tts import MinimaxTTSService


async def test_tts_latency(num_tests: int = 5):
    """Run TTS latency tests."""
    api_key = os.getenv("MINIMAX_API_KEY")
    group_id = os.getenv("MINIMAX_GROUP_ID")

    if not api_key:
        print("ERROR: MINIMAX_API_KEY environment variable not set")
        return

    print("=" * 50)
    print("TTS Latency Test")
    print("=" * 50)
    print(f"Running {num_tests} tests...")
    print()

    tts = MinimaxTTSService(
        voice_id="mallory",
        api_key=api_key,
        group_id=group_id
    )

    test_text = "Hello, how can I help you today?"
    latencies = []

    for i in range(num_tests):
        print(f"Test {i + 1}/{num_tests}...", end=" ")

        start_time = time.perf_counter()
        first_chunk_time = None
        total_chunks = 0

        async for chunk in tts.stream_tts(test_text):
            if first_chunk_time is None:
                first_chunk_time = time.perf_counter()
            total_chunks += 1

        if first_chunk_time:
            latency_ms = (first_chunk_time - start_time) * 1000
            latencies.append(latency_ms)
            print(f"First chunk: {latency_ms:.1f}ms, Total chunks: {total_chunks}")
        else:
            print("ERROR: No audio received")

    await tts.close()

    print()
    print("-" * 50)
    print("Results:")
    print(f"  Average latency: {sum(latencies) / len(latencies):.1f}ms")
    print(f"  Min latency: {min(latencies):.1f}ms")
    print(f"  Max latency: {max(latencies):.1f}ms")
    print()

    avg_latency = sum(latencies) / len(latencies)
    if avg_latency < 200:
        print("✓ PASS: Average latency is under 200ms target")
    else:
        print("✗ FAIL: Average latency exceeds 200ms target")

    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(test_tts_latency())

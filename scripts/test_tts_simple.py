#!/usr/bin/env python3
"""Simplified TTS Latency Test - standalone version."""
import asyncio
import time
import os
import httpx

async def test_tts_latency():
    api_key = os.getenv("MINIMAX_API_KEY")
    group_id = os.getenv("MINIMAX_GROUP_ID")
    base_url = "https://api.minimax.chat/v1"

    if not api_key:
        print("ERROR: MINIMAX_API_KEY not set")
        return

    print("=" * 50)
    print("TTS Latency Test (Minimax)")
    print("=" * 50)

    client = httpx.AsyncClient(timeout=30.0)
    test_text = "Hello, how can I help you today?"
    latencies = []

    for i in range(5):
        print(f"Test {i + 1}/5...", end=" ")

        payload = {
            "model": "speech-01-turbo",
            "text": test_text,
            "stream": True,
            "voice_setting": {"voice_id": "mallory", "speed": 1.0},
            "audio_setting": {"sample_rate": 16000, "format": "pcm", "channel": 1}
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        url = f"{base_url}/text_to_speech"
        if group_id:
            url = f"{base_url}/text_to_speech?GroupId={group_id}"

        start_time = time.perf_counter()
        first_chunk_time = None
        total_chunks = 0

        async with client.stream("POST", url, json=payload, headers=headers) as response:
            if response.status_code != 200:
                print(f"ERROR: Status {response.status_code}")
                text = await response.aread()
                print(text.decode()[:200])
                continue
            async for chunk in response.aiter_bytes():
                if first_chunk_time is None:
                    first_chunk_time = time.perf_counter()
                total_chunks += 1

        if first_chunk_time:
            latency_ms = (first_chunk_time - start_time) * 1000
            latencies.append(latency_ms)
            print(f"First chunk: {latency_ms:.1f}ms, Chunks: {total_chunks}")
        else:
            print("ERROR: No audio received")

    await client.aclose()

    if latencies:
        print()
        print("-" * 50)
        print("Results:")
        print(f"  Average: {sum(latencies) / len(latencies):.1f}ms")
        print(f"  Min: {min(latencies):.1f}ms")
        print(f"  Max: {max(latencies):.1f}ms")
        avg = sum(latencies) / len(latencies)
        if avg < 200:
            print(f"\n[PASS] {avg:.1f}ms is under 200ms target")
        else:
            print(f"\n[FAIL] {avg:.1f}ms exceeds 200ms target")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test_tts_latency())

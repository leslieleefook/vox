#!/usr/bin/env python3
"""Simplified STT Latency Test - standalone version."""
import asyncio
import time
import os
import json
import struct
import math
import websockets

def generate_test_audio(duration_seconds: float = 2.0, sample_rate: int = 16000) -> bytes:
    """Generate a simple test audio tone."""
    samples = int(duration_seconds * sample_rate)
    audio = bytearray()
    for i in range(samples):
        t = i / sample_rate
        value = int(16000 * math.sin(2 * math.pi * 440 * t))
        audio.extend(struct.pack('<h', value))
    return bytes(audio)

async def test_stt_latency():
    api_key = os.getenv("DEEPGRAM_API_KEY")

    if not api_key:
        print("ERROR: DEEPGRAM_API_KEY not set")
        return

    print("=" * 50)
    print("STT Latency Test (Deepgram)")
    print("=" * 50)

    # Deepgram streaming websocket URL
    url = f"wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&interim_results=true"

    headers = {"Authorization": f"Token {api_key}"}

    try:
        print("Connecting to Deepgram...")
        start_connect = time.perf_counter()
        async with websockets.connect(url, additional_headers=headers) as ws:
            connect_time = (time.perf_counter() - start_connect) * 1000
            print(f"Connected in {connect_time:.1f}ms")
            print()

            test_audio = generate_test_audio(duration_seconds=2.0)

            first_result_time = None
            results = []

            async def receive():
                nonlocal first_result_time
                start_time = time.perf_counter()
                try:
                    async for msg in ws:
                        if first_result_time is None:
                            first_result_time = time.perf_counter()
                        data = json.loads(msg)
                        if "channel" in data:
                            transcript = data["channel"]["alternatives"][0].get("transcript", "")
                            is_final = data.get("is_final", False)
                            if transcript:
                                results.append(transcript)
                                print(f"  Received: '{transcript[:50]}...' (final={is_final})")
                                if len(results) >= 3:
                                    break
                except websockets.ConnectionClosed:
                    pass
                return (first_result_time - start_time) * 1000 if first_result_time else None

            print("Sending test audio...")
            # Send audio in chunks
            chunk_size = 4800  # 150ms at 16kHz
            send_task = asyncio.create_task(receive())

            for i in range(0, len(test_audio), chunk_size):
                chunk = test_audio[i:i + chunk_size]
                await ws.send(chunk)
                await asyncio.sleep(0.1)

            # Send close signal
            await ws.send(json.dumps({"type": "CloseStream"}))

            latency_ms = await send_task

            if latency_ms:
                print()
                print(f"First transcript latency: {latency_ms:.1f}ms")
                if latency_ms < 200:
                    print(f"[PASS] Latency is under 200ms target")
                else:
                    print(f"[FAIL] Latency exceeds 200ms target")
            else:
                print("ERROR: No transcripts received")

    except Exception as e:
        print(f"ERROR: {e}")

    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test_stt_latency())

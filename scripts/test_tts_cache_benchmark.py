#!/usr/bin/env python3
"""
TTS Cache Latency Benchmark

Measures and compares TTS latency with and without caching.
- Target for cached: <10ms (Redis fetch)
- Target for uncached: <200ms (API call)

Usage:
    python scripts/test_tts_cache_benchmark.py
"""

import asyncio
import time
import os
import sys
from unittest.mock import MagicMock
from dotenv import load_dotenv

# Load .env from project root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
load_dotenv(os.path.join(project_dir, ".env"))

# Mock webrtcvad before importing (Windows doesn't have C++ build tools)
sys.modules['webrtcvad'] = MagicMock()

# Add agent-worker directory to path for imports
agent_worker_dir = os.path.join(project_dir, "agent-worker")
sys.path.insert(0, agent_worker_dir)

from app.services.tts import MinimaxTTSService
from app.services.tts_cache import tts_cache, COMMON_PHRASES


async def benchmark_uncached(tts: MinimaxTTSService, test_phrases: list[str], num_runs: int = 3):
    """Benchmark TTS without cache."""
    print("\n" + "=" * 60)
    print("UNCACHED TTS LATENCY (Cold API calls)")
    print("=" * 60)

    latencies = []

    for phrase in test_phrases[:3]:  # Test first 3 phrases
        for run in range(num_runs):
            # Clear cache for this phrase
            await tts_cache.invalidate(phrase, tts.voice_id)

            print(f"  [{run+1}/{num_runs}] '{phrase[:30]}...' ", end="", flush=True)

            start_time = time.perf_counter()
            first_chunk_time = None
            total_size = 0

            async for chunk in tts.stream_tts(phrase, use_cache=False):
                if first_chunk_time is None:
                    first_chunk_time = time.perf_counter()
                total_size += len(chunk)

            if first_chunk_time:
                latency_ms = (first_chunk_time - start_time) * 1000
                latencies.append(latency_ms)
                print(f"-> {latency_ms:.1f}ms ({total_size} bytes)")
            else:
                print("-> ERROR: No audio received")

    return latencies


async def benchmark_cached(tts: MinimaxTTSService, test_phrases: list[str], num_runs: int = 5):
    """Benchmark TTS with cache."""
    print("\n" + "=" * 60)
    print("CACHED TTS LATENCY (Redis fetch)")
    print("=" * 60)

    # Pre-warm cache with test phrases
    print("\nPre-warming cache...")
    for phrase in test_phrases[:3]:
        audio = await tts.synthesize(phrase)
        await tts_cache.set(phrase, tts.voice_id, audio)
        print(f"  Cached: '{phrase[:30]}...' ({len(audio)} bytes)")

    latencies = []

    print("\nRunning cached benchmarks...")
    for phrase in test_phrases[:3]:
        for run in range(num_runs):
            print(f"  [{run+1}/{num_runs}] '{phrase[:30]}...' ", end="", flush=True)

            start_time = time.perf_counter()
            first_chunk_time = None
            total_size = 0

            async for chunk in tts.stream_tts(phrase, use_cache=True):
                if first_chunk_time is None:
                    first_chunk_time = time.perf_counter()
                total_size += len(chunk)

            if first_chunk_time:
                latency_ms = (first_chunk_time - start_time) * 1000
                latencies.append(latency_ms)
                print(f"-> {latency_ms:.1f}ms ({total_size} bytes)")
            else:
                print("-> ERROR: No audio received")

    return latencies


async def benchmark_prewarm(tts: MinimaxTTSService):
    """Benchmark pre-warming common phrases."""
    print("\n" + "=" * 60)
    print("PRE-WARMING COMMON PHRASES")
    print("=" * 60)

    # Clear existing cache
    await tts_cache.clear_all()

    phrases = COMMON_PHRASES[:10]  # Test first 10 phrases
    latencies = []

    print(f"\nPre-warming {len(phrases)} common phrases...")
    for i, phrase in enumerate(phrases):
        print(f"  [{i+1}/{len(phrases)}] '{phrase[:30]}...' ", end="", flush=True)

        start_time = time.perf_counter()
        audio = await tts.synthesize(phrase)
        await tts_cache.set(phrase, tts.voice_id, audio)
        elapsed = (time.perf_counter() - start_time) * 1000

        latencies.append(elapsed)
        print(f"-> {elapsed:.1f}ms ({len(audio)} bytes)")

    return latencies


async def run_benchmark():
    """Run full TTS cache benchmark."""
    api_key = os.getenv("MINIMAX_API_KEY")
    group_id = os.getenv("MINIMAX_GROUP_ID")

    if not api_key:
        print("ERROR: MINIMAX_API_KEY environment variable not set")
        return

    # Connect to Redis cache (use localhost when running outside Docker)
    print("Connecting to Redis cache...")
    # Override Redis URL for local testing
    import redis.asyncio as redis
    tts_cache._client = redis.from_url(
        "redis://localhost:6379",
        encoding="utf-8",
        decode_responses=False
    )
    try:
        await tts_cache._client.ping()
        print("Cache status: connected")
    except Exception as e:
        print(f"Cache status: disconnected ({e})")
        tts_cache._client = None

    cache_stats = await tts_cache.get_stats()
    print(f"Cache enabled: {cache_stats.get('enabled', False)}")

    tts = MinimaxTTSService(
        voice_id="mallory",
        api_key=api_key,
        group_id=group_id
    )

    # Test phrases (mix of common phrases and custom)
    test_phrases = [
        "Hello, how can I help you today?",
        "One moment please",
        "Thank you for calling",
    ]

    print("\n" + "#" * 60)
    print("# TTS CACHE LATENCY BENCHMARK")
    print("#" * 60)

    # Run benchmarks
    uncached_latencies = await benchmark_uncached(tts, test_phrases, num_runs=2)
    cached_latencies = await benchmark_cached(tts, test_phrases, num_runs=5)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    if uncached_latencies:
        avg_uncached = sum(uncached_latencies) / len(uncached_latencies)
        print(f"\n[UNCACHED] API calls:")
        print(f"   Average: {avg_uncached:.1f}ms")
        print(f"   Min: {min(uncached_latencies):.1f}ms")
        print(f"   Max: {max(uncached_latencies):.1f}ms")

    if cached_latencies:
        avg_cached = sum(cached_latencies) / len(cached_latencies)
        print(f"\n[CACHED] Redis fetch:")
        print(f"   Average: {avg_cached:.1f}ms")
        print(f"   Min: {min(cached_latencies):.1f}ms")
        print(f"   Max: {max(cached_latencies):.1f}ms")

    if uncached_latencies and cached_latencies:
        improvement = avg_uncached / avg_cached
        reduction = ((avg_uncached - avg_cached) / avg_uncached) * 100
        print(f"\n[IMPROVEMENT]")
        print(f"   Speedup: {improvement:.1f}x faster")
        print(f"   Latency reduction: {reduction:.1f}%")
        print(f"   Time saved per request: {avg_uncached - avg_cached:.1f}ms")

    # Final cache stats
    final_stats = await tts_cache.get_stats()
    print(f"\n[CACHE STATS]")
    print(f"   Entries: {final_stats.get('entries', 'N/A')}")
    print(f"   TTL: {final_stats.get('ttl_seconds', 'N/A')}s")

    # Cleanup
    await tts.close()
    await tts_cache.disconnect()

    print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(run_benchmark())

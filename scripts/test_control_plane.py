#!/usr/bin/env python3
"""
Control Plane Health Test

Tests the control plane REST API endpoints.

Usage:
    python scripts/test_control_plane.py
"""

import asyncio
import httpx
import os


async def test_control_plane():
    """Test control plane API endpoints."""
    base_url = os.getenv("API_URL", "http://localhost:8000")

    print("=" * 50)
    print("Control Plane API Test")
    print("=" * 50)
    print(f"Base URL: {base_url}")
    print()

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Test health endpoint
        print("Testing /api/v1/health...")
        try:
            response = await client.get(f"{base_url}/api/v1/health")
            if response.status_code == 200:
                data = response.json()
                print(f"  Status: {data['status']}")
                print(f"  Database: {data['database']}")
                print(f"  Redis: {data['redis']}")
                print("  ✓ Health check passed")
            else:
                print(f"  ✗ Health check failed: {response.status_code}")
        except Exception as e:
            print(f"  ✗ Health check failed: {e}")

        print()

        # Test clients endpoint
        print("Testing /api/v1/clients...")
        try:
            response = await client.get(f"{base_url}/api/v1/clients")
            if response.status_code == 200:
                clients = response.json()
                print(f"  Found {len(clients)} clients")
                print("  ✓ Clients endpoint passed")
            else:
                print(f"  ✗ Clients endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"  ✗ Clients endpoint failed: {e}")

        print()

        # Test assistants endpoint
        print("Testing /api/v1/assistants...")
        try:
            response = await client.get(f"{base_url}/api/v1/assistants")
            if response.status_code == 200:
                assistants = response.json()
                print(f"  Found {len(assistants)} assistants")
                print("  ✓ Assistants endpoint passed")
            else:
                print(f"  ✗ Assistants endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"  ✗ Assistants endpoint failed: {e}")

        print()

        # Test call logs endpoint
        print("Testing /api/v1/call-logs...")
        try:
            response = await client.get(f"{base_url}/api/v1/call-logs")
            if response.status_code == 200:
                data = response.json()
                print(f"  Found {data['total']} call logs")
                print("  ✓ Call logs endpoint passed")
            else:
                print(f"  ✗ Call logs endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"  ✗ Call logs endpoint failed: {e}")

    print()
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(test_control_plane())

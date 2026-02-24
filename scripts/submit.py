#!/usr/bin/env python3
"""POST resume payload to Wave API.

Bearer token format per Wave's instructions:
  wave_ + (country code) + _ + (any characters)
  e.g. wave_KE_ericgitangu

Set WAVE_BEARER_TOKEN env var or it defaults to wave_KE_ericgitangu.
"""

import json
import os
import sys
from pathlib import Path

ENDPOINT = "https://api.wave.com/submit_resume"
PAYLOAD = Path(__file__).resolve().parent.parent / "payload" / "resume.json"
DEFAULT_TOKEN = "wave_KE_ericgitangu"


def post_httpx(data: dict, token: str) -> None:
    import httpx
    r = httpx.post(
        ENDPOINT,
        json=data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=30,
    )
    print(f"{r.status_code} {r.reason_phrase}")
    print(r.text)


def post_urllib(data: dict, token: str) -> None:
    from urllib.request import Request, urlopen
    from urllib.error import HTTPError
    body = json.dumps(data).encode()
    req = Request(
        ENDPOINT,
        data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(req, timeout=30) as resp:
            print(f"{resp.status} {resp.reason}")
            print(resp.read().decode())
    except HTTPError as e:
        print(f"{e.code} {e.reason}")
        print(e.read().decode())


def main() -> None:
    token = os.environ.get("WAVE_BEARER_TOKEN", DEFAULT_TOKEN)
    print(f"Endpoint: {ENDPOINT}")
    print(f"Token: {token[:12]}...")
    print(f"Payload: {PAYLOAD}")
    print()

    with open(PAYLOAD) as f:
        data = json.load(f)

    try:
        post_httpx(data, token)
    except ImportError:
        post_urllib(data, token)


if __name__ == "__main__":
    main()

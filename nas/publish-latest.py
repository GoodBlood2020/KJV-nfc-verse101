#!/usr/bin/env python3
"""Publish the newest finished Daily Lift MP4 to the existing GitHub repository.

Optional standalone NAS uploader: this script is NOT run by the video generator.
Requires a fine-grained GitHub token stored in a read-only local file.
"""
import base64
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.request

REPO = "GoodBlood2020/KJV-nfc-verse101"
BASE = f"https://api.github.com/repos/{REPO}/contents/"
OUTPUT = Path(os.getenv("DAILY_LIFT_OUTPUT", "/output"))
# Optional private optimized copies. When configured, do not publish a raw
# daily MP4 while waiting for its finished TikTok layout copy.
OPTIMIZED_OUTPUT = Path(os.environ["DAILY_LIFT_OPTIMIZED_DIR"]) if os.getenv("DAILY_LIFT_OPTIMIZED_DIR") else None
TOKEN_FILE = Path(os.getenv("GITHUB_TOKEN_FILE", "/run/secrets/github_token"))
VIDEO_PATH = "media/daily-lift-latest.mp4"
MANIFEST_PATH = "media/latest.json"
PATTERN = re.compile(r"^daily-lift-(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.mp4$")
POLL_SECONDS = 300
MIN_FILE_AGE_SECONDS = 120
REFERENCE_PATTERN = re.compile(r"^[1-3]?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d{1,3}:\d{1,3}(?:-\d{1,3})?$")
KNOWN = {"chest-fly": ("Dumbbell Chest Fly", "Galatians 6:9"),
         "dumbbell-chest-fly": ("Dumbbell Chest Fly", "Galatians 6:9"),
         "pull-ups": ("Pull Ups", "Philippians 3:14")}
# Keep GitHub as a bridge for short clips, not a long-term media warehouse.
MAX_BYTES = 4 * 1024 * 1024


def call(path, token, method="GET", payload=None):
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "User-Agent": "DailyLift-NAS-Publisher/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    if body is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(BASE + path, headers=headers, data=body, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        if error.code == 404 and method == "GET":
            return None
        # Never print request headers or tokens.
        raise RuntimeError(f"GitHub returned HTTP {error.code} for {path}") from None


def remote_sha(path, token):
    existing = call(path, token)
    return existing["sha"] if existing else None


def write_file(path, raw, message, token):
    payload = {
        "message": message,
        "branch": "main",
        "content": base64.b64encode(raw).decode("ascii"),
    }
    sha = remote_sha(path, token)
    if sha:
        payload["sha"] = sha
    call(path, token, method="PUT", payload=payload)


def candidate():
    found = []
    now = time.time()
    for file in OUTPUT.glob("daily-lift-*.mp4"):
        match = PATTERN.fullmatch(file.name)
        if match and file.is_file() and not file.is_symlink():
            try:
                st = file.stat()
                day = dt.date.fromisoformat(match.group(1))
                if (day <= dt.date.today() and 0 < st.st_size <= MAX_BYTES and
                        st.st_mtime <= now - MIN_FILE_AGE_SECONDS):
                    found.append((match.group(1), st.st_mtime, file, match.group(2)))
            except (OSError, ValueError):
                pass
    return max(found, default=None, key=lambda item: (item[0], item[1]))


def publish():
    if not TOKEN_FILE.is_file():
        print("Publisher inactive: GitHub token file not configured.", flush=True)
        return
    token = TOKEN_FILE.read_text(encoding="utf-8").strip()
    if not token:
        print("Publisher inactive: GitHub token file empty.", flush=True)
        return
    selected = candidate()
    if not selected:
        print("No finished Daily Lift MP4 found yet.", flush=True)
        return
    date, _, file, slug = selected
    # Reject malformed calendar dates.
    if dt.date.fromisoformat(date).isoformat() != date:
        return
    size = file.stat().st_size
    if size > MAX_BYTES:
        print(f"Skipped {file.name}: {size} bytes exceeds the 4 MiB safety cap.", flush=True)
        return
    public_file = file
    if OPTIMIZED_OUTPUT is not None:
        # Strict mode: a missing optimized output must NOT publish an old layout.
        public_file = OPTIMIZED_OUTPUT / file.name
        if not public_file.is_file() or public_file.is_symlink():
            print(f"Waiting for optimized video: {file.name}", flush=True)
            return
        optimized_stat = public_file.stat()
        if (optimized_stat.st_mtime < file.stat().st_mtime or
                optimized_stat.st_mtime > time.time() - MIN_FILE_AGE_SECONDS or
                not 1000 <= optimized_stat.st_size <= MAX_BYTES):
            print(f"Waiting for finished optimized video: {file.name}", flush=True)
            return
    raw = public_file.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    title, reference = KNOWN.get(slug, (slug.replace("-", " ").title(), "Philippians 4:13"))
    sidecar = file.with_suffix(".json")
    if sidecar.is_file() and 0 < sidecar.stat().st_size <= 4096:
        try:
            details = json.loads(sidecar.read_text(encoding="utf-8"))
            if isinstance(details, dict) and details.get("date") == date and details.get("slug") == slug:
                candidate_title = details.get("title")
                candidate_reference = details.get("reference")
                if (isinstance(candidate_title, str) and 1 <= len(candidate_title) <= 80 and
                        not any(ord(c) < 32 for c in candidate_title)):
                    title = candidate_title
                if (isinstance(candidate_reference, str) and len(candidate_reference) <= 48 and
                        REFERENCE_PATTERN.fullmatch(candidate_reference)):
                    reference = candidate_reference
        except (OSError, ValueError, UnicodeError):
            pass
    manifest = {"date": date, "slug": slug, "title": title,
                "reference": reference, "sha256": digest}
    if OPTIMIZED_OUTPUT is not None:
        manifest["layoutVersion"] = "compact-v3"
    current = call(MANIFEST_PATH, token)
    if current and current.get("content") and current.get("encoding") == "base64":
        old = json.loads(base64.b64decode(current["content"]).decode("utf-8"))
        # Recover public playback if the MP4 was removed while retaining its manifest.
        if old == manifest and remote_sha(VIDEO_PATH, token):
            return

    # Upload video FIRST; update manifest only after successful video upload.
    # Vercel deploys on both commits but eventually serves the matched pair.
    print(f"Uploading {'optimized ' if OPTIMIZED_OUTPUT is not None else ''}finished {file.name} to GitHub...", flush=True)
    write_file(VIDEO_PATH, raw, f"Publish Daily Lift video for {date} ({slug})", token)
    write_file(MANIFEST_PATH, json.dumps(manifest, separators=(",", ":")).encode("utf-8"),
               f"Show Daily Lift video for {date} ({slug})", token)
    print("Published latest.mp4 and latest.json. Check Vercel deployment.", flush=True)


if __name__ == "__main__":
    print("Daily Lift GitHub publisher started: NAS output read-only.", flush=True)
    while True:
        try:
            publish()
        except Exception as error:
            print(f"Publishing check failed: {error}", flush=True)
        time.sleep(POLL_SECONDS)

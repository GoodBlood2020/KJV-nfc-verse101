# DailyLift public watch video and private posting originals

This folder is deployed to the public DailyLift by DJ website and can be accessed by NFC-tag visitors.

- `latest.json`: date, exercise title, slug, scripture reference and checksum.
- `daily-lift-latest.mp4`: public **watching** copy of the current workout. The website uses custom controls **without a Download button**.
- `exercise-preview.svg`: fallback decorative illustration, not the video.
- `daily-lift-chest-fly-test.mp4`: legacy test video not deployed; redirects to illustration.

**Security limitation:** Any browser that can watch the public MP4 receives its bytes. Hiding Download in the player is only a user-interface choice, not DRM and not a guarantee that a visitor cannot save or record the video. Avoid uploading confidential or exclusively licensed source footage.

The original NAS video files, NAS catalog and owner posting downloads are separate from the public watching copy. Use the signed-in DailyLift Studio TikTok workspace to download a private NAS video where the existing 3.5 MB / three-minute preview transfer supports it.

The NAS GitHub publisher source in `nas/publish-latest.py` again publishes a public watching copy plus matching manifest so today's video changes automatically. The script on the running NAS must be checked separately: updating the GitHub script does not update an already-mounted container file.

Older historical clips may remain accessible via GitHub history or caches.

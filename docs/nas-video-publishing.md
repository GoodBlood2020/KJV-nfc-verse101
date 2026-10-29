# DailyLift public playback and private owner posting

## The experience

**Visitors via web/NFC:** Watch today's exercise MP4 with Play, Pause, Seek and Sound controls. The website does not display a public Download button or browser-native video controls. It also shows the daily workout, KJV verse, and TikTok profile link.

**Owner via signed-in Studio:** The private NAS Video Library and TikTok Posting Workspace provide authenticated preview and, for compatible clips, a private download action. The preview bridge currently supports files up to 3.5 MB and links expire after three minutes; larger originals require a separate NAS-side export. The UGREEN NAS remains the source for original posting-ready videos.

## Actual limits of download protection

This is **not DRM**. A browser must receive video bytes to play them. A visitor with developer tools, a downloader, or screen recording software can still save the public watching copy. A Download-free interface makes casual saving less obvious, but does not make access owner-exclusive. For stronger protection in the future, use a separately exported low-resolution / visibly watermarked public preview and retain the full-resolution original on NAS, or consider DRM streaming. DRM still cannot block screen recording completely.

## NAS publishing and continuity

`nas/publish-latest.py` generates a matching manifest and uploads the current public watching MP4. It is a separate non-root publisher; it does not alter NAS originals or the generator/archive. This source update **does not update** the version mounted into a running NAS container. Check the installed version before relying on it to publish tomorrow's exercise. The script must retain its original NAS read-only mount and outbound HTTPS only.

The live website loads `media/latest.json` and `media/daily-lift-latest.mp4`. When video publication fails, the daily KJV verse and workout plan remain independent. A legacy `media/daily-lift-chest-fly-test.mp4` route redirects to the illustration and is no longer offered as a public video.

## Historical media and sharing

The public repository contains today's public viewing copy and can retain older clips in Git history. Anyone can fetch public Git media independently from the UI. Never assume a public video file is inaccessible just because the video player lacks a Download button.

## Preserved automation

DailyLift v2 generator, NAS scheduled jobs, archive receipts, NAS catalog, private previews, TikTok posting workspace, and trainer website/enrollment remain separate.

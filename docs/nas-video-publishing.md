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

## Compact TikTok layout processor integration (optional)

The independent `dailylift-tiktok-layout` processor reads the generator ReadyToPost and Published folders *read-only* and creates distinct 720x1280 MP4s under `/volume1/DailyLift-Private/Output/ReadyForTikTok`. It never modifies the original.

To publish that better-composed MP4 to the public NFC website automatically, **after testing the processor**, mount its private output into the existing GitHub public-video publisher as `- /volume1/DailyLift-Private/Output/ReadyForTikTok:/optimized:ro`, set its environment `DAILY_LIFT_OPTIMIZED_DIR: /optimized`, and replace only the publisher’s installed script with the latest `nas/publish-latest.py`. The source update alone does not modify the running NAS container. Back up the publisher project config first and preserve its existing secret and read-only original mount.

With this optional variable enabled, the publisher waits for the optimized version of the same filename and will not upload the raw old-layout video. Once optimized bytes are available, it uploads the MP4 plus a manifest with `layoutVersion: "compact-v3"`; the website then adjusts its action-only center crop. The authenticated Studio posting workflow remains separate, and the optimized file should be selected directly from the private NAS folder for TikTok.

**Timing:** The processor waits 90 seconds for the source to settle; the publisher waits 120 seconds for an optimized video, then checks every five minutes. Confirm logs and the live website before assuming tomorrow’s scheduled post has the new layout.

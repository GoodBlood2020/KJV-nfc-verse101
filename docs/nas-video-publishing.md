# Zero-additional-storage-subscription NAS video publishing

Daily Lift can use the **existing** UGREEN NAS + GitHub + Vercel accounts.
No Cloudflare R2 account, new cloud storage subscription, NAS port forwarding,
or third-party video host is required.

## How it works

1. The network-isolated NAS generator writes finished videos into
   `DailyLift-Private/Output/ReadyToPost`, retaining originals privately.
2. A **separate** non-root publisher container reads the most recent completed
   MP4 and pushes a public copy to the existing GitHub repo using a fine-grained
   GitHub access token restricted to `GoodBlood2020/KJV-nfc-verse101`.
3. It updates **two files** on branch `main`:
   - `media/daily-lift-latest.mp4` (one live file replaced daily)
   - `media/latest.json` (date + known exercise slug)
4. GitHub triggers an automatic Vercel deployment; the website loads the
   latest manifest and displays the new video.
5. If publishing hasn't been configured or fails, the website keeps working:
   the daily workout and KJV verse are independent, and the existing static
   Chest Fly spotlight stays available.

Manifest example:
```json
{"date":"2026-10-27","slug":"pull-ups","sha256":"<hex sha256 of video>"}
```
`sha256` is used by the publisher to skip unchanged videos; the website
requires only `date` and `slug`. Allowed slugs: `chest-fly`, `pull-ups`.

## No automatic publishing until authorized

Before enabling the publisher, **review the MoveKit license** and verify
it expressly permits redistribution/public hosting of these edited sample MP4s.
If it doesn't, use your own footage or obtain the correct license.

The publisher code is provided as `nas/publish-latest.py`. It is *not*
deployed merely by merging this PR. It requires a local NAS read-only token
file and an additional Docker Compose project.

Steps after license approval:

1. Create a fine-grained GitHub PAT with **Contents: Read and write**, scoped
   to **only** `GoodBlood2020/KJV-nfc-verse101`. No admin/workflow permissions.
   Use a reasonable expiration and plan token rotation.
2. Store it only in a NAS private file readable by UID 1006; don't paste it
   into GitHub files, Docker Compose, screenshots, or chat.
3. Put `nas/publish-latest.py` in the private NAS automation folder and mount
   it and the token read-only in a non-root publisher container. Mount
   `ReadyToPost` read-only. The publisher needs outbound HTTPS only.
4. Verify the upload logs, the new GitHub commit, and the Vercel deployment.
   Existing `daily-lift-scheduled` should keep `network_mode: none`.

## Limits and tradeoffs

- GitHub is **not** intended as long-term streaming video storage. It recommends
  a single Git object under 1 MB and enforces a 100 MB limit. Replacing the
  same MP4 keeps the current branch small, but Git history still grows.
  Track file sizes and repository growth; stop this approach if videos get
  large, traffic is heavy, or the media license forbids publication.
- Vercel's Hobby plan has usage and non-commercial restrictions. It may stop
  serving or deploying beyond its limits. This setup is not a guarantee of
  unlimited free hosting.
- The NAS stays the master copy and archive; GitHub has **one public copy**
  for viewers. Visitors do not directly connect to the NAS.
- This does not post videos to TikTok. The website's daily workout-plan
  rotation and the latest NAS video are separate features.

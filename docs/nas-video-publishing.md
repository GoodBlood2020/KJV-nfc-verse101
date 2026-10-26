# Publishing NAS videos to Daily Lift

This is a **future publishing connection**, not an uploader. The website remains
unchanged until a public, licensed MP4 and manifest have been uploaded and the
Vercel environment variable below has been configured.

## Architecture

1. UGREEN NAS `DailyLift-Private/Output/ReadyToPost` generates an MP4 using
   non-root UID 1006 / GID 100.
2. A separate, outbound-only uploader (to be configured) uploads the *finished*
   MP4 to a dedicated Cloudflare R2 public-video bucket.
3. **After the video upload succeeds**, the uploader replaces `latest.json`.
4. The website's `/api/video` reads `latest.json` and builds a video URL
   anchored to the configured public media domain.
5. The browser shows "Latest Daily Lift video" when a valid manifest exists.
   The existing Bible cards, daily workout, and original demo remain operational.

## Vercel setting

Set the **server-side** environment variable `DAILY_LIFT_MEDIA_BASE_URL` to the
R2 bucket's public HTTPS custom domain (trailing slash optional), e.g.
`https://media.example.com/`. Redeploy to apply the setting.

Do not set this variable to an S3 API endpoint or a private URL. A Cloudflare
R2 `r2.dev` address is development-only and rate-limited; use a custom domain
for production. Leave the variable unset until the public host is ready.

## Published object keys

Video object, e.g.:
`videos/daily-lift-2026-10-27-pull-ups.mp4`

Latest manifest at bucket root: `latest.json`

```json
{
  "date": "2026-10-27",
  "videoKey": "videos/daily-lift-2026-10-27-pull-ups.mp4"
}
```

The API enforces this exact filename format and allows only `chest-fly`
and `pull-ups` filenames. Scripture and exercise titles are kept in trusted
website code rather than accepted from the remote manifest.

When uploading `latest.json`, configure it with
`Content-Type: application/json` and `Cache-Control: no-cache`, so clients can
observe new versions. Upload MP4 with `Content-Type: video/mp4` and stable,
immutable keys. Never publish a manifest pointing to an unfinished upload.

## Important safety notes

- Check that the actual MoveKit license authorizes redistribution or public
  hosting of these **edited samples** before enabling public uploads. Do not
  upload original, unedited source animations or private license documents.
- Do not store Cloudflare access keys, upload tokens, or rclone.conf in GitHub.
- Make a **separate** uploader container with outbound internet access and
  read-only access to NAS output. Keep the FFmpeg generator network-isolated.
- Use a bucket-scoped, least-privilege R2 credential; don't open inbound NAS
  ports, grant access to the Docker socket, or use root to upload.
- The website's rotating daily workout plan is independent of this latest
  demonstration video. A Pull Ups video does not change Tuesday's workout plan.

# DailyLift private posting and public image preview

## Security boundary

- Private NAS: finished, posting-ready MP4 files stay on the UGREEN NAS.
- Private Studio: the owner-signed-in `/tiktok` and `/media` workflows request temporary NAS previews through protected `/api/nas/preview/*` endpoints. These previews may be reduced size and are NOT verified original-size posting downloads.
- Public website and NFC visitors: the image `media/exercise-preview.svg`, exercise title, date, verse, and optional TikTok profile link. The public page no longer embeds MP4.
- The public `media/latest.json` contains metadata only. Older GitHub commits may still contain MP4 blobs.

## Required NAS publisher change (urgent)

The repository version of `nas/publish-latest.py` now uploads public metadata JSON ONLY, and never writes video bytes into GitHub. **This change does not propagate to a script already mounted into a running NAS container.** The old uploader polls every five minutes and may publish another MP4 when the selected exercise or date changes.

1. In UGREEN NAS, identify the separate DailyLift GitHub public video publisher Docker container/Compose stack. Do not stop the generator, NAS media catalog, verified archive or TikTok workspace.
2. Pause only that GitHub MP4 uploader before another daily upload, OR revoke the uploader's fine-grained GitHub Contents write token. Do not expose or paste that token.
3. Replace its mounted `publish-latest.py` from the current GitHub `nas/publish-latest.py` file, preserving the original read-only NAS paths and mounts.
4. Restart ONLY the metadata publisher. Look for log text: `Published public metadata only; private MP4 never uploaded.` Verify the installed script has no video-upload call.
5. After the next video selection, check GitHub public `media/`: no MP4 should be added. The live website should show the illustrated exercise card, and old MP4 paths should redirect to the SVG.

## Historical copies and future access

Removing the MP4 files from the current branch does not erase them from public Git history, older Vercel deployments, third-party caches or recipients' devices. Consider making the GitHub repository private (after checking the Vercel Git connection) and rotating the old uploader token. Even a private repository does not protect an MP4 if Vercel serves it at a public URL.

The private Studio NAS preview is already behind owner login. A true full-resolution, posting-ready **download button** requires an authenticated NAS-side export path and remains a separate feature to verify; this update does not claim to have implemented one.

## Unchanged workflows

NAS generation, read-only source mounts, archive receipts, private video catalog, TikTok workspace, and the verse/daily plan remain separate and unchanged. The new public site uses metadata and a static image only.

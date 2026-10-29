# DailyLift public media — STILL IMAGES ONLY

This folder is deployed to the public DailyLift by DJ website and is accessible to anyone with a link or NFC tag.

NEVER commit, upload or publish MP4, WebM, MOV, source exercise footage, purchased exercise assets or posting-ready NAS videos here.

- `latest.json` holds non-sensitive public daily exercise metadata (title, date, verse reference, slug, checksum).
- `exercise-preview.svg` is a static illustrated image, not footage from the private NAS.
- Posting-ready video stays on the UGREEN NAS. The Studio NAS media workflows remain owner-authenticated.
- The two known legacy MP4 URLs redirect to the SVG through `vercel.json`.

**Urgent NAS operator action:** Update the copy of `nas/publish-latest.py` mounted in the currently running GitHub publisher container and restart only that publisher. This GitHub source change does not update an existing NAS container. Until then, pause only the public GitHub uploader or revoke its fine-grained Contents write token so it cannot re-upload tomorrow's MP4. Preserve the generator, archive, NAS catalog and Studio.

Previously committed MP4 objects may remain accessible in public Git history and cached copies. Removing files from the current branch cannot revoke those copies.

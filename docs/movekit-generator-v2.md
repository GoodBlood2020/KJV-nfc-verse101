# Daily Lift: Metadata-driven MoveKit Generator v2

The current **NAS -> GitHub -> Vercel** architecture is retained, without extra
cloud storage accounts or home-network port forwarding.

## Changes to the website and publisher

- The latest video widget in `app.js` now accepts any safe exercise slug.
  The manifest can include the full title and scripture reference.
- `nas/publish-latest.py` accepts generated MP4s named
  `daily-lift-YYYY-MM-DD-EXERCISE-SLUG.mp4`, with any safe slug.
- When a matching JSON sidecar exists, it provides the title and KJV scripture
  reference; old sample videos without sidecars still work.
- The publisher waits until a file is at least 120 seconds old, caps upload
  size at 4 MiB, and rejects future-dated files.
- Only the newest **finished video** and `media/latest.json` are uploaded.
  Original MoveKit video assets stay private on the NAS.

## Generator v2: NAS deployment

Use the supplied **Daily Lift MoveKit Generator v2 ZIP** (containing a
Dockerfile, dynamic renderer, test/scheduled Compose files, and publisher file)
and follow its START-HERE instructions.

The generator uses the existing imported library:

- `/volume1/DailyLift-Private/MoveKit/Animations` (read-only)
- `/volume1/DailyLift-Private/MoveKit/Metadata` (read-only)
- `/volume1/DailyLift-Private/Output/ReadyToPost` (write-only destination in normal operation)

It reads JSON/CSV `videoFile`, `name`, `primaryMuscles`, `movementPattern`,
and `difficulty` fields from standard MoveKit metadata, choosing a daily
exercise from all eligible video files. It creates a branded vertical MP4
with the exercise name, muscle focus, a thematically matched KJV reference,
and a short KJV excerpt. FFmpeg generates the overlay text automatically
without needing a PNG for each exercise.

It also creates a sidecar, for example:

```json
{
  "date": "2026-10-27",
  "slug": "pull-ups",
  "title": "Pull Ups",
  "reference": "Philippians 3:14",
  "primaryMuscles": ["Back"],
  "schemaVersion": 2
}
```

The publisher converts this to the website's latest manifest and adds a
SHA-256 cache-busting identifier. The existing two sample animations stay
available and the previous scheduler is a rollback option.

## Required deployment order

1. Upload the new Python renderer and Dockerfile to the NAS, and run the
   **V2Test** container writing only to `Output/V2Test`.
2. Merge this PR to allow the website to display new exercises.
3. Stop the old `daily-lift-scheduled` project (do not delete it).
4. Start `daily-lift-v2-scheduled` on UID/GID `1006:100`.
5. Stop the old publisher, replace the NAS's local `publish-latest.py`
   with the v2 copy, and restart the publisher. The existing securely
   stored GitHub token is reused; **do not upload or paste it anywhere**.
6. Check the new generator logs and Vercel website after the next upload.

At runtime, generation remains non-root, offline, with read-only sources.
Docker needs network access only during its one-time image build.

## Limits

- Verify the purchased pack's license before publicly hosting its finished
  videos; sample pack permission does not automatically cover every purchase.
- If purchased clips exceed 4 MiB after rendering, the publisher skips them
  until we add additional compression or revise the hosting approach.
- GitHub and Vercel have usage and repository-growth limits; this is a
  practical small-video workflow, not unlimited free video hosting.

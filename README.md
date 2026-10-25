# KJV NFC Verse — Daily Faith + Fitness

This is the existing KJV NFC verse website enhanced with a date-based KJV verse and approachable daily movement plan. Existing NFC tags and QR codes can continue pointing to the same root URL.

## What changed

- `/api/daily` returns today's locally curated KJV passage, reflection, movement routine, and optional TikTok video URL. No outside API is required for this daily endpoint.
- The daily content follows the **America/Chicago** calendar date for all visitors. There are 14 curated passages on a rotating 14-day cycle and seven weekly movement routines, including recovery days.
- The page renders the daily plan **without modifying `index.html`**. The old random verse and share buttons remain functional.
- Visitors can select **Beginner** or **Regular** and check off movements. Selections and daily progress are saved **in that browser only** using localStorage; there are no accounts or server-side tracking.
- `/api/verse` now rejects non-GET methods, limits provider wait times, uses the secondary source after a primary error, returns HTTP `503` when both providers fail, and avoids leaking provider diagnostics in its response. The frontend respects non-200 status codes.

## Edit the daily plan

Update `VERSES` and `WORKOUTS` in `api/daily.js`, then commit the change. Verse text should be double-checked against the **King James Version** before publishing. The `videoUrl` field defaults to `null` — replace it with a verified public TikTok video URL when you have that video. The frontend accepts only `https://...tiktok.com` links.

For a real 30-day or 365-day unique devotional calendar, add and review more curated daily verses before promoting the project as unique every day. Currently passages repeat every 14 days.

## Run tests

Requires Node.js 20 or newer.

```sh
npm test
```

The test suite checks consistency across a day, calendar rollover in Chicago, expected weekdays, response status codes, and the two-provider failure path. Network responses are mocked; passing tests do **not** prove a live Vercel deployment is healthy.

## Deployment

Upload these changed files to the existing GitHub repository or apply the accompanying patch, then deploy via the existing Vercel project. You don't need to rewrite NFC tags; the same root URL is still used.

To verify after deployment, load `/api/daily` and confirm it returns a verse and workout, then open the homepage and test the New verse and Share buttons. Check `/api/verse` multiple times, including while providers are unavailable if possible.

## Exercise disclaimer

This is general movement guidance, not a personalized medical or rehabilitation plan. Offer an appropriate choice of activity and encourage visitors to stop for pain, dizziness, or other symptoms and seek individualized professional guidance when needed.

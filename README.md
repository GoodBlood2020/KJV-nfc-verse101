# Daily Lift — Faith + Fitness

**A daily KJV verse and approachable workout plan.** Daily Lift pairs scripture, reflection, and movement in one NFC-friendly experience. Existing NFC tags and QR codes can continue pointing to the same root URL.

## Brand and domain maintenance

- **Public brand:** Daily Lift
- **Descriptor:** Faith + Fitness
- **Tagline:** A daily KJV verse and approachable workout plan.
- **Current URL:** `https://kjv-nfc-verse101.vercel.app/` (keep active for existing NFC tags).
- The GitHub repository and Vercel project retain their existing identifiers. Rebranding the website does not automatically register a domain or change NFC destinations.
- If a custom domain is purchased, configure it in the existing Vercel project and test it before updating printed materials or NFC tags. Existing links should continue to work.

## How the site works

- `/api/daily` returns today's locally curated KJV passage, reflection, movement routine, and optional TikTok video URL. No outside API is required for this daily endpoint.
- The daily content follows the **America/Chicago** calendar date for all visitors. There are 14 curated passages on a rotating 14-day cycle and seven weekly movement routines, including recovery days.
- `app.js` inserts the daily plan into the static page. The New verse and Share buttons operate on the separate random verse card.
- Visitors can select **Beginner** or **Regular** and check off movements. Selections and daily progress are saved **in that browser only** using localStorage; there are no accounts or server-side tracking.
- `/api/verse` now rejects non-GET methods, limits provider wait times, uses the secondary source after a primary error, returns HTTP `503` when both providers fail, and avoids leaking provider diagnostics in its response. The frontend respects non-200 status codes.

## Edit the daily plan

Update `VERSES` and `WORKOUTS` in `api/daily.js`, then commit the change. Verse text should be double-checked against the **King James Version** before publishing. The `videoUrl` field defaults to `null` — replace it with a verified public TikTok video URL when you have that video. The frontend accepts only `https://...tiktok.com` links.

For a real 30-day or 365-day unique devotional calendar, add and review more curated daily verses before promoting the project as unique every day. Currently passages repeat every 14 days.

## TikTok profile integration

The daily workout card includes a permanent **Follow @djephthah on TikTok** link to `https://www.tiktok.com/@djephthah`. It is a profile link, **not** an automatic match to the day's exercise demonstration. The link is rendered in `app.js` and styled in `styles.css`. To change the creator handle in the future, update those references.

Daily video deep links are separate: `api/daily.js` currently returns `videoUrl: null`, so a "Watch today's workout" link appears only after a verified public TikTok video URL is configured. Don't describe a profile link as a video of today's workout.

## Exercise Spotlight (first NAS-rendered video)

The homepage has an optional **Dumbbell Chest Fly** showcase, deliberately separate from the server-selected daily workout. The section is hidden automatically until the edited MP4 at `/media/daily-lift-chest-fly-test.mp4` is present and its metadata loads, so a missing file does not break the homepage.

To finish publishing this first demo:
1. Verify your specific MoveKit sample's license permits **public** website/social-media use. The download's `LICENSE.txt` links to MoveKit's paid-content agreement; confirm that the same grant applies to free samples before publishing.
2. Export/download the **finished 8-second Daily Lift-branded MP4** from `DailyLift./Output/ReadyToPost` on the UGREEN NAS, not the original MoveKit animation.
3. Upload the edited MP4 to the `media/` directory on this PR branch under the exact name `daily-lift-chest-fly-test.mp4` using GitHub's **Add file → Upload files** interface.
4. Review the Vercel preview: the spotlight should display and the video should play. Check that the daily plan and random verse still work.
5. Merge only after licensing, media presence, and preview are verified.

Never upload raw purchased MoveKit library files or license keys into this public repository. The NAS remains the private source library. Future automation should use an appropriate licensed publishing route for finished videos rather than committing hundreds of video assets to Git history.

## Run tests

Requires Node.js 20 or newer.

```sh
npm test
```

The test suite checks consistency across a day, calendar rollover in Chicago, expected weekdays, response status codes, and the two-provider failure path. Network responses are mocked; passing tests do **not** prove a live Vercel deployment is healthy.

## Deployment

Deploy through the existing Vercel project connected to this repository. Confirm the project's production branch and preview settings in Vercel before publishing. Keep the root URL stable so existing NFC tags and QR codes continue to work.

To verify after deployment, load `/api/daily` and confirm it returns a verse and workout, then open the homepage and test the New verse and Share buttons. Check `/api/verse` multiple times, including while providers are unavailable if possible.

## Exercise disclaimer

This is general movement guidance, not a personalized medical or rehabilitation plan. Offer an appropriate choice of activity and encourage visitors to stop for pain, dizziness, or other symptoms and seek individualized professional guidance when needed.

## File guide

| File | Maintenance responsibility |
| --- | --- |
| `index.html` | Static page, random verse IDs, and native-share/clipboard fallback. |
| `app.js` | Fetches both endpoints, builds the daily card, handles retries and browser storage. |
| `styles.css` | Theme variables, cards, exercise states, keyboard focus, and small-screen layout. |
| `api/verse.js` | Random KJV provider requests, timeout, fallback selection, and public error responses. |
| `api/daily.js` | Curated passages, weekly workouts, Chicago calendar selection, and daily endpoint. |
| `verses.kjv.references.json` | Reference pool for the secondary random-verse provider; not offline verse text. |
| `vercel.json` | Includes the reference JSON in the deployed verse function. |
| `test/site.test.mjs` | Seven automated endpoint and calendar tests using mocked network responses. |
| `package.json` | ES module configuration and the `npm test` command; no dependencies are declared. |

## Local development

1. Install Node.js 20 or newer and clone the repository.
2. Run `npm test` from the repository root. No dependency installation is required for the current tests.
3. For the full page, use a Vercel-compatible local environment, such as `vercel dev` with the separately installed Vercel CLI. There is no `npm start` script. A static file server alone cannot run the two `/api/*` functions.
4. Open the URL printed by the development server. Test both endpoints as well as the homepage.

The current code reads no environment variables and requires no Bible API keys.
Keep future secrets in server-side deployment settings, never in browser JavaScript.

## Configuration and content maintenance

- **Daily calendar:** `TIME_ZONE` in `api/daily.js` is `America/Chicago`, shared by all visitors. Reloading fetches the current date; an already-open page does not automatically refresh at midnight.
- **Passage rotation:** `VERSES` is indexed by the Chicago calendar date converted to an epoch-day number, modulo the array length. It is not a January 1 calendar. Changing its order or length changes which passage maps to a date.
- **Weekly movement:** `WORKOUTS[0]` is Sunday and `WORKOUTS[6]` is Saturday. Keep seven entries, with a title, focus, minutes, and exercises containing `name`, `beginner`, and `regular` display text.
- **Workout videos:** The daily response currently sets `videoUrl: null`. A future implementation can supply a verified public HTTPS TikTok URL; the browser ignores other hosts and malformed links.
- **Random verses:** `api/verse.js` first calls `bible-api.com/data/kjv/random`, then tries `dailybible.ca` with a reference from the JSON pool. Each request has a 4,500 ms timeout. An unreadable or empty pool falls back to `John 3:16`, which still needs the secondary service.
- **Browser preferences:** `kjv-nfc-level` stores difficulty. `kjv-nfc-progress-YYYY-MM-DD-LEVEL` stores checked exercise indexes for each date and level. Clearing site storage resets these values; there is no account synchronization or automatic cleanup of old progress keys. Reordering exercises can reinterpret already-saved indexes.
- **Appearance:** Start with the CSS variables in `:root`. Keep the IDs and class names used by `app.js` synchronized with the HTML and CSS.

## Troubleshooting and future changes

- If random verses fail, check Vercel function logs for provider errors, timeouts, or reference-file errors. Both providers failing returns HTTP `503` with `VERSE_UNAVAILABLE`; provider diagnostics stay in server logs.
- The browser retries a random verse once after 800 ms. The daily card instead offers a manual retry button. Failure in one card does not prevent the other from loading.
- Both endpoints reject non-GET methods with `405` and set `Cache-Control: no-store`. Preserve these contracts when extending the APIs unless a behavior change is intentional and reviewed.
- If progress disappears, check whether browser storage is blocked or cleared. Storage failures are tolerated; visitors can still use the page.
- Share uses the current random verse. Native sharing is preferred; otherwise it tries the clipboard and finally an alert. Browser support and permissions affect these paths.
- For future features, work on a separate branch, keep changes focused, run the existing tests, and add coverage for new behavior. Mocked tests do not cover real provider availability, browser interactions, or deployment configuration.
- Before merging, review the diff and use a preview deployment to check mobile layout, keyboard focus, both difficulty levels, progress after reload, New verse, Share, and error/retry messages.
- Calendar changes should retain checks around Chicago midnight and daylight-saving transitions. Provider changes should check response validation, timeout/fallback behavior, method rejection, and safe public errors.

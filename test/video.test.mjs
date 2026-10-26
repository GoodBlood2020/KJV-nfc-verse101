import test from "node:test";
import assert from "node:assert/strict";
import videoHandler, { parsePublishedVideo } from "../api/video.js";

function response() {
  return {
    statusCode: 200, headers: {}, body: null,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
}

test("Published video manifest accepts only approved NAS filenames", () => {
  const base = new URL("https://media.example.com/");
  const valid = parsePublishedVideo({
    date: "2026-10-27",
    videoKey: "videos/daily-lift-2026-10-27-pull-ups.mp4"
  }, base);
  assert.equal(valid.title, "Pull Ups");
  assert.equal(valid.reference, "Philippians 3:14");
  assert.equal(valid.videoUrl, "https://media.example.com/videos/daily-lift-2026-10-27-pull-ups.mp4");
  assert.equal(parsePublishedVideo({date:"2026-10-27",videoKey:"https://evil.example/video.mp4"}, base), null);
  assert.equal(parsePublishedVideo({date:"2026-10-27",videoKey:"videos/daily-lift-2026-10-26-pull-ups.mp4"}, base), null);
  assert.equal(parsePublishedVideo({date:"2026-02-30",videoKey:"videos/daily-lift-2026-02-30-pull-ups.mp4"}, base), null);
});

test("Video endpoint stays quietly unavailable until configured", async () => {
  const previous = process.env.DAILY_LIFT_MEDIA_BASE_URL;
  delete process.env.DAILY_LIFT_MEDIA_BASE_URL;
  try {
    const res = response();
    await videoHandler({method:"GET"}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {available:false});
  } finally {
    if (previous === undefined) delete process.env.DAILY_LIFT_MEDIA_BASE_URL;
    else process.env.DAILY_LIFT_MEDIA_BASE_URL = previous;
  }
});

test("Video endpoint reads the public manifest from the configured media origin", async () => {
  const previous = process.env.DAILY_LIFT_MEDIA_BASE_URL;
  const previousFetch = globalThis.fetch;
  process.env.DAILY_LIFT_MEDIA_BASE_URL = "https://media.example.com/";
  globalThis.fetch = async url => {
    assert.equal(String(url), "https://media.example.com/latest.json");
    return {ok:true,text:async()=>JSON.stringify({
      date:"2026-10-27",videoKey:"videos/daily-lift-2026-10-27-pull-ups.mp4"
    })};
  };
  try {
    const res = response();
    await videoHandler({method:"GET"}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.available, true);
    assert.equal(res.body.title, "Pull Ups");
  } finally {
    globalThis.fetch = previousFetch;
    if (previous === undefined) delete process.env.DAILY_LIFT_MEDIA_BASE_URL;
    else process.env.DAILY_LIFT_MEDIA_BASE_URL = previous;
  }
});

test("Video endpoint rejects non-GET without fetching media", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("unexpected network request"); };
  try {
    const res = response();
    await videoHandler({method:"POST"}, res);
    assert.equal(res.statusCode, 405);
  } finally { globalThis.fetch = previousFetch; }
});

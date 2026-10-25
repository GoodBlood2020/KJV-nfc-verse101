import test from "node:test";
import assert from "node:assert/strict";
import verseHandler from "../api/verse.js";
import dailyHandler, { getDailyContent } from "../api/daily.js";

// Minimal Vercel-style response double: capture status, headers and JSON without a server.
function response() {
  return {
    statusCode: 200, headers: {}, body: null,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
}

// These seven tests use Node built-ins; no live Bible API or browser is required.
// Node's mock concurrency: keep fetch replacement tests non-concurrent.
test("Daily plan is deterministic on the same Chicago date", () => {
  const a = getDailyContent(new Date("2026-10-25T06:00:00Z"));
  const b = getDailyContent(new Date("2026-10-25T23:00:00Z"));
  assert.equal(a.date, "2026-10-25");
  assert.deepEqual(a, b);
  assert.equal(a.verse.translation, "KJV");
  assert.ok(a.workout.exercises.length > 0);
});

// In this October fixture Chicago is UTC-5; the two instants straddle local midnight.
test("Daily plan respects local Chicago midnight and day of week", () => {
  const before = getDailyContent(new Date("2026-10-26T04:59:00Z"));
  const after = getDailyContent(new Date("2026-10-26T05:01:00Z"));
  assert.equal(before.date, "2026-10-25");
  assert.equal(after.date, "2026-10-26");
  assert.equal(before.workout.focus, "Gentle recovery");
  assert.equal(after.workout.focus, "Strength");
});

test("Daily endpoint responds to GET and rejects POST", () => {
  let res = response();
  dailyHandler({method:"GET"}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.verse.translation, "KJV");
  res = response();
  dailyHandler({method:"POST"}, res);
  assert.equal(res.statusCode, 405);
});

// Replace global fetch to make provider tests repeatable; finally always restores it.
test("Random verse endpoint returns verse from primary provider", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => ({ok:true,json:async()=>({reference:"John 3:16", text:"For God so loved the world"})});
  try {
    const res = response();
    await verseHandler({method:"GET"}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.reference, "John 3:16");
    assert.equal(res.body.translation, "KJV");
  } finally { globalThis.fetch = old; }
});

test("Random verse endpoint tries fallback if primary fails", async () => {
  const old = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async url => {
    requests++;
    if (String(url).includes("bible-api.com")) return {ok:false,status:429};
    return {ok:true,json:async()=>({reference:"Psalm 23:4",text:"Yea, though I walk through the valley"})};
  };
  try {
    const res = response();
    await verseHandler({method:"GET"}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.source, "dailybible.ca");
    assert.equal(requests, 2);
  } finally { globalThis.fetch = old; }
});

// Suppress expected server logs while checking that private error details stay off the wire.
test("Both providers failing returns HTTP 503 without leaking details", async () => {
  const old = globalThis.fetch;
  const log = console.error;
  console.error = () => {};
  globalThis.fetch = async () => { throw new Error("private provider failure details"); };
  try {
    const res = response();
    await verseHandler({method:"GET"}, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.error, "VERSE_UNAVAILABLE");
    assert.ok(!JSON.stringify(res.body).includes("private provider failure details"));
  } finally { globalThis.fetch = old; console.error = log; }
});

test("Verse endpoint rejects POST without calling external services", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("unexpected fetch"); };
  try {
    const res = response();
    await verseHandler({method:"POST"}, res);
    assert.equal(res.statusCode, 405);
  } finally { globalThis.fetch = old; }
});

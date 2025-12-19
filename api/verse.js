// Tries bible-api.com first (true random KJV),
// falls back to dailybible.ca (random reference from local pool) if bible-api is rate-limited/down.

import fs from "fs";
import path from "path";

function pickRandomRefFromFullIndexFallbackPool() {
  // IMPORTANT: this is a fallback pool (can be expanded).
  // If you want the *true full* 31,102-verse index offline,
  // that’s a separate build step (bigger file).
  const filePath = path.join(process.cwd(), "verses.kjv.references.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  // Supports either {verses:[...]} or {themes:{...}}
  if (Array.isArray(data.verses) && data.verses.length) return data.verses[Math.floor(Math.random() * data.verses.length)];

  if (data.themes && typeof data.themes === "object") {
    const all = Object.values(data.themes).flat().filter(Boolean);
    if (all.length) return all[Math.floor(Math.random() * all.length)];
  }

  // last-resort
  return "John 3:16";
}

async function tryBibleApiRandomKJV() {
  const r = await fetch("https://bible-api.com/data/kjv/random", {
    headers: { accept: "application/json" }
  });

  // bible-api rate limit: 15 requests / 30 seconds per IP :contentReference[oaicite:1]{index=1}
  if (r.status === 429) throw new Error("RATE_LIMIT");

  if (!r.ok) throw new Error(`BIBLE_API_HTTP_${r.status}`);

  const j = await r.json();

  let reference = "";
  let text = "";

  if (typeof j.reference === "string" && j.reference.trim()) reference = j.reference.trim();
  if (typeof j.text === "string" && j.text.trim()) text = j.text.trim();

  if ((!reference || !text) && Array.isArray(j.verses) && j.verses.length) {
    const v0 = j.verses[0];
    if (!reference && v0?.book_name && v0?.chapter && v0?.verse) {
      reference = `${v0.book_name} ${v0.chapter}:${v0.verse}`;
    }
    if (!text) text = j.verses.map(v => v.text).join(" ").trim();
  }

  if (!text) throw new Error("BIBLE_API_PARSE_FAIL");
  if (!reference) reference = "KJV Verse";

  return { reference, text, source: "bible-api.com (KJV)" };
}

async function fallbackDailyBibleKJV() {
  // dailybible.ca is a public-domain Bible API (verse lookup by reference) :contentReference[oaicite:2]{index=2}
  const ref = pickRandomRefFromFullIndexFallbackPool();
  const refUrl = encodeURIComponent(ref).replace(/%20/g, "+");
  const r = await fetch(`https://dailybible.ca/api/${refUrl}?translation=kjv`, {
    headers: { accept: "application/json" }
  });
  if (!r.ok) throw new Error(`DAILYBIBLE_HTTP_${r.status}`);
  const j = await r.json();

  const reference = j.reference || ref;
  const text = j.text || "";
  if (!text) throw new Error("DAILYBIBLE_PARSE_FAIL");

  return { reference, text, source: "dailybible.ca (KJV, public domain)" };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    // Primary: true random from bible-api.com
    const out = await tryBibleApiRandomKJV();
    return res.status(200).json(out);
  } catch (e) {
    // Fallback: still returns a verse even if bible-api is busy/down
    try {
      const out2 = await fallbackDailyBibleKJV();
      return res.status(200).json(out2);
    } catch (e2) {
      return res.status(200).json({
        reference: "Try again",
        text: "Verse services are temporarily busy. Wait 10–20 seconds and tap again.",
        source: `primary=${String(e)} fallback=${String(e2)}`
      });
    }
  }
}

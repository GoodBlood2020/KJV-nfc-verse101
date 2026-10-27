import fs from "node:fs";
import path from "node:path";

// Each external request has its own 4.5-second timeout; providers are tried in order.
const TIMEOUT_MS = 4500;
const DEFAULT_REFERENCE = "John 3:16";

// Support either a flat verses array or the current themed reference lists.
// This file supplies references, not offline verse text; the secondary API is still needed.
function pickFallbackReference() {
  try {
    const file = path.join(process.cwd(), "verses.kjv.references.json");
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const references = Array.isArray(data.verses)
      ? data.verses
      : Object.values(data.themes || {}).flat();
    const valid = references.filter(item => typeof item === "string" && item.trim());
    if (valid.length) return valid[Math.floor(Math.random() * valid.length)];
  } catch (error) {
    console.error("Verse reference fallback file unavailable:", error);
  }
  return DEFAULT_REFERENCE;
}

// Fetch JSON with an Accept header and reject HTTP errors before parsing the body.
async function requestJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`Bible provider returned HTTP ${response.status}`);
  return response.json();
}

// bible-api.com may return top-level text or a verses array; normalize both shapes.
async function primaryVerse() {
  const data = await requestJson("https://bible-api.com/data/kjv/random");
  const randomVerse = data.random_verse;
  const verses = Array.isArray(data.verses) ? data.verses : [];
  const reference = (typeof data.reference === "string" && data.reference.trim()) ||
    (randomVerse?.book && randomVerse?.chapter && randomVerse?.verse
      ? `${randomVerse.book} ${randomVerse.chapter}:${randomVerse.verse}` : "") ||
    (verses[0]?.book_name && verses[0]?.chapter && verses[0]?.verse
      ? `${verses[0].book_name} ${verses[0].chapter}:${verses[0].verse}` : "");
  const text = (typeof data.text === "string" && data.text.trim()) ||
    (typeof randomVerse?.text === "string" && randomVerse.text.trim()) ||
    verses.map(verse => verse.text || "").join(" ").trim();
  if (!reference || !text) throw new Error("Primary provider supplied an invalid verse");
  return { reference, text, translation: "KJV", source: "bible-api.com" };
}

// dailybible.ca looks up a selected reference with the KJV translation explicitly set.
async function secondaryVerse() {
  const selected = pickFallbackReference();
  const encoded = encodeURIComponent(selected).replace(/%20/g, "+");
  const data = await requestJson(`https://dailybible.ca/api/${encoded}?translation=kjv`);
  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) throw new Error("Fallback provider supplied an invalid verse");
  const reference = typeof data.reference === "string" && data.reference.trim()
    ? data.reference.trim() : selected;
  return { reference, text, translation: "KJV", source: "dailybible.ca" };
}

// Vercel endpoint: avoid cached random results and reject unsupported methods early.
// Log provider diagnostics on the server; return only a generic 503 if both fail.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  try {
    return res.status(200).json(await primaryVerse());
  } catch (primaryError) {
    console.error("Primary Bible provider failed:", primaryError);
  }
  try {
    return res.status(200).json(await secondaryVerse());
  } catch (secondaryError) {
    console.error("Secondary Bible provider failed:", secondaryError);
  }
  return res.status(503).json({
    error: "VERSE_UNAVAILABLE",
    message: "Verse services are temporarily unavailable. Please try again."
  });
}

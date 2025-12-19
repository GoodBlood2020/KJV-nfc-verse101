export default async function handler(req, res) {
  const upstream = "https://bible-api.com/data/kjv/random"; // KJV random verse endpoint :contentReference[oaicite:0]{index=0}

  try {
    const r = await fetch(upstream, { headers: { accept: "application/json" } });

    // Rate limit info (15 requests / 30 seconds by IP) :contentReference[oaicite:1]{index=1}
    if (r.status === 429) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        reference: "Rate limited",
        text: "Too many taps too fast. Wait 10–20 seconds and try again.",
        source: "bible-api.com rate limit"
      });
    }

    const j = await r.json();

    // DEBUG MODE: visit /api/verse?debug=1 to see the raw upstream response
    if (req.query?.debug === "1") {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        upstream,
        raw: j
      });
    }

    // --- Robust parsing (handles multiple shapes) ---
    let reference = "KJV Verse";
    let text = "";

    // Shape A: { reference, text }
    if (typeof j.text === "string" && j.text.trim()) {
      text = j.text.trim();
      if (j.reference) reference = j.reference;
    }

    // Shape B: { verses: [{ book_name, chapter, verse, text }, ...] }
    if (!text && Array.isArray(j.verses) && j.verses.length) {
      text = j.verses.map(v => v.text).join(" ").trim();
      const v0 = j.verses[0];
      if (v0?.book_name && v0?.chapter && v0?.verse) {
        reference = `${v0.book_name} ${v0.chapter}:${v0.verse}`;
      }
    }

    // Shape C: { random_verse: { book_name, chapter, verse, text } }
    if (!text && j.random_verse?.text) {
      text = String(j.random_verse.text).trim();
      const rv = j.random_verse;
      if (rv.book_name && rv.chapter && rv.verse) {
        reference = `${rv.book_name} ${rv.chapter}:${rv.verse}`;
      }
    }

    // Shape D: { verse: { ... } } (some APIs do this)
    if (!text && j.verse?.text) {
      text = String(j.verse.text).trim();
      const v = j.verse;
      if (v.book_name && v.chapter && v.verse) {
        reference = `${v.book_name} ${v.chapter}:${v.verse}`;
      }
    }

    if (!text) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        reference: "No verse text",
        text: "Upstream returned JSON but verse text was not found. Use /api/verse?debug=1.",
        source: "parser"
      });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      reference,
      text,
      source: "bible-api.com (KJV)"
    });

  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      reference: "Error",
      text: "Could not load a verse. Try again.",
      source: String(e)
    });
  }
}

export default async function handler(req, res) {
  try {
    const url = "https://bible-api.com/data/kjv/random"; // random KJV verse endpoint :contentReference[oaicite:2]{index=2}
    const r = await fetch(url, { headers: { accept: "application/json" } });

    // Handle rate limit clearly (they rate-limit by IP) :contentReference[oaicite:3]{index=3}
    if (r.status === 429) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        reference: "Rate limit",
        text: "Too many requests right now. Wait 10–20 seconds and tap again.",
        source: "bible-api.com rate limit"
      });
    }

    if (!r.ok) throw new Error(`Upstream HTTP ${r.status}`);

    const j = await r.json();

    // Normalize different response shapes so you always get text
    let reference = j.reference || "KJV Verse";
    let text = "";

    if (typeof j.text === "string" && j.text.trim()) {
      text = j.text.trim();
    } else if (Array.isArray(j.verses) && j.verses.length) {
      text = j.verses.map(v => v.text).join(" ").trim();
      const v0 = j.verses[0];
      if (v0?.book_name && v0?.chapter && v0?.verse) {
        reference = `${v0.book_name} ${v0.chapter}:${v0.verse}`;
      }
    }

    if (!text) {
      // If bible-api returns something unexpected, we still show a clear message
      reference = "No verse text";
      text = "The verse API returned an unexpected format. Tap again in a few seconds.";
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      reference,
      text,
      source: "bible-api.com (KJV)"
    });

  } catch (e) {
    // Show a useful message instead of blank
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      reference: "Service unavailable",
      text: "The verse service is temporarily down or blocked. Wait 10–30 seconds and tap again.",
      source: String(e)
    });
  }
}

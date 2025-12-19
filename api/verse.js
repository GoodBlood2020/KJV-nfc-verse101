export default async function handler(req, res) {
  try {
    const r = await fetch("https://bible-api.com/data/kjv/random", {
      headers: { accept: "application/json" }
    });

    if (!r.ok) throw new Error(`Upstream HTTP ${r.status}`);
    const j = await r.json();

    let reference = "KJV Verse";
    let text = "";

    // Case 1: direct text
    if (j.text && typeof j.text === "string") {
      text = j.text.trim();
      reference = j.reference || reference;
    }

    // Case 2: verses array
    if ((!text || text.length === 0) && Array.isArray(j.verses)) {
      text = j.verses.map(v => v.text).join(" ").trim();

      if (j.verses.length > 0) {
        const v = j.verses[0];
        reference = `${v.book_name} ${v.chapter}:${v.verse}`;
      }
    }

    // Absolute fallback (should never hit, but safe)
    if (!text) {
      throw new Error("No verse text parsed from API response");
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      reference,
      text,
      source: "bible-api.com (KJV)"
    });

  } catch (e) {
    res.status(500).json({
      reference: "Error",
      text: "Could not load a verse. Please try again.",
      source: String(e)
    });
  }
}

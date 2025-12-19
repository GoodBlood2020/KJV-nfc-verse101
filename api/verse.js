export default async function handler(req, res) {
  try {
    const r = await fetch("https://bible-api.com/data/kjv/random", {
      headers: { accept: "application/json" }
    });

    if (!r.ok) throw new Error(`Upstream HTTP ${r.status}`);
    const j = await r.json();

    let reference = "";
    let text = "";

    // A) If top-level reference/text exist
    if (typeof j.reference === "string" && j.reference.trim()) {
      reference = j.reference.trim();
    }
    if (typeof j.text === "string" && j.text.trim()) {
      text = j.text.trim();
    }

    // B) If verses[] exists, build reference + text from it
    if (Array.isArray(j.verses) && j.verses.length) {
      const v0 = j.verses[0];

      if (!reference && v0?.book_name && v0?.chapter && v0?.verse) {
        reference = `${v0.book_name} ${v0.chapter}:${v0.verse}`;
      }

      // Join all verses (covers multi-verse passages too)
      if (!text) {
        text = j.verses.map(v => v.text).join(" ").trim();
      }
    }

    // Final safety
    if (!reference) reference = "KJV Verse";
    if (!text) throw new Error("No verse text parsed");

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      reference,
      text,
      source: "bible-api.com (KJV)"
    });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      reference: "Error",
      text: "Could not load a verse. Try again.",
      source: String(e)
    });
  }
}

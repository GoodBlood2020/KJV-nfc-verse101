export default async function handler(req, res) {
  try {
    // Full-KJV random verse:
    // docs: /data/TRANSLATION_ID/random  where TRANSLATION_ID can be "kjv"
    const r = await fetch("https://bible-api.com/data/kjv/random", {
      headers: { accept: "application/json" }
    });

    if (!r.ok) throw new Error(`Upstream HTTP ${r.status}`);

    const j = await r.json();

    // bible-api returns JSON with reference + text (and sometimes other fields)
    const reference = j.reference || j.verses?.[0]?.book_name
      ? `${j.verses[0].book_name} ${j.verses[0].chapter}:${j.verses[0].verse}`
      : "KJV Verse";

    const text =
      j.text ||
      (j.verses && j.verses.map(v => v.text).join(" ").trim()) ||
      "";

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      reference,
      text,
      source: "bible-api.com (KJV)"
    });
  } catch (e) {
    res.status(500).json({
      reference: "Error",
      text: "Could not load a verse. Try again.",
      source: String(e)
    });
  }
}

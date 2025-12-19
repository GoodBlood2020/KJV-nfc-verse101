const refEl = document.getElementById('ref');
const verseEl = document.getElementById('verse');

async function loadVerse() {
  refEl.textContent = "Loading…";
  verseEl.textContent = "Getting a fresh verse…";

  try {
    const res = await fetch('/api/verse', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Always show reference if present
    refEl.textContent =
      (typeof data.reference === "string" && data.reference.trim())
        ? data.reference
        : "KJV Verse";

    // Always show verse text if present
    verseEl.textContent =
      (typeof data.text === "string" && data.text.trim())
        ? data.text
        : "Verse text unavailable.";

  } catch (e) {
    refEl.textContent = "Error";
    verseEl.textContent =
      "Could not load a verse. Please try again in a few seconds.";
  }
}

// Load one verse immediately when page opens
loadVerse();

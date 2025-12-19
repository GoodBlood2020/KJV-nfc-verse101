const refEl = document.getElementById('ref');
const verseEl = document.getElementById('verse');

async function loadVerse() {
  refEl.textContent = "Loading...";
  verseEl.textContent = "Getting a fresh verse…";

  try {
    const res = await fetch('/api/verse', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    refEl.textContent = data.reference || "KJV Verse";
    verseEl.textContent = data.text || "No verse text returned.";
  } catch (e) {
    refEl.textContent = "Oops.";
    verseEl.textContent = "Could not load a verse. Check your internet connection and try again.";
  }
}

loadVerse();


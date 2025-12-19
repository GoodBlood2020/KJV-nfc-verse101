const refEl = document.getElementById('ref');
const verseEl = document.getElementById('verse');

let busy = false;

function setUI(reference, text) {
  refEl.textContent = reference || "KJV Verse";
  verseEl.textContent = text || "";
}

async function fetchVerseOnce() {
  const res = await fetch('/api/verse', { cache: 'no-store' });
  const data = await res.json();

  // If backend explicitly returns an error message, treat as failure
  if (
    (typeof data.reference === "string" && data.reference.toLowerCase() === "error") ||
    (typeof data.text === "string" && data.text.toLowerCase().includes("could not load"))
  ) {
    throw new Error("Verse service error");
  }

  setUI(data.reference || "KJV Verse", data.text || "Verse text unavailable.");
}

async function loadVerse() {
  if (busy) return;
  busy = true;

  setUI("Loading…", "Getting a fresh verse…");

  try {
    // First attempt
    await fetchVerseOnce();
  } catch {
    // Small delay, then retry once
    await new Promise(r => setTimeout(r, 1200));

    try {
      await fetchVerseOnce();
    } catch {
      setUI(
        "Try again",
        "Verse service is busy right now. Wait a few seconds and tap again."
      );
    }
  } finally {
    busy = false;
  }
}

// Expose globally so onclick="loadVerse()" keeps working
window.loadVerse = loadVerse;

// Load one verse immediately on page open
loadVerse();

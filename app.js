// Browser controller: the daily plan and random verse load independently.
// These IDs belong to the static random-verse card in index.html.
const refEl = document.getElementById("ref");
const verseEl = document.getElementById("verse");
let busy = false;

// Use textContent so API text is displayed as text rather than interpreted as HTML.
function setUI(reference, text) {
  refEl.textContent = reference || "KJV Verse";
  verseEl.textContent = text || "";
}

// The server chooses a Bible provider; the browser validates its normalized response.
async function fetchVerseOnce() {
  const response = await fetch("/api/verse", { cache: "no-store" });
  if (!response.ok) throw new Error(`Verse API returned HTTP ${response.status}`);
  const data = await response.json();
  if (data.error || typeof data.reference !== "string" ||
      typeof data.text !== "string" || !data.text.trim()) {
    throw new Error("Verse API returned invalid content");
  }
  setUI(data.reference, data.text);
}

// Ignore overlapping clicks. Retry once after 800 ms, then show a friendly error.
// finally releases the click guard whether the request succeeds or fails.
async function loadVerse() {
  if (busy) return;
  busy = true;
  setUI("Loading…", "Getting a fresh verse…");
  try {
    await fetchVerseOnce();
  } catch {
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      await fetchVerseOnce();
    } catch {
      setUI("Try again", "Verse service is temporarily unavailable. Please try again.");
    }
  } finally {
    busy = false;
  }
}

// Preserve the existing inline onclick handler and random verse behavior.
window.loadVerse = loadVerse;

// Build the daily card with DOM nodes and plain text instead of HTML strings.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Storage is optional: blocked access falls back to defaults without stopping the page.
function savedValue(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

function saveValue(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Private browsing may block storage. */ }
}

// Insert the daily plan before the existing verse card and announce updates politely.
const dailyCard = el("section", "card daily-card");
dailyCard.setAttribute("aria-label", "Today's faith and fitness plan");
dailyCard.setAttribute("aria-live", "polite");
const verseCard = document.querySelector("main .card");
if (verseCard) verseCard.before(dailyCard);
const heading = document.querySelector(".hero h1");
const intro = document.querySelector(".hero .sub");
if (heading) heading.textContent = "Your Daily Word + Workout";
if (intro) intro.textContent = "A daily KJV verse and approachable movement plan. Tap New verse below for an extra scripture.";
dailyCard.append(el("p", "daily-loading", "Loading today's verse and workout…"));

// Check the basic response shape before replacing the loading message.
function renderDaily(data) {
  if (!data || !data.verse || !data.workout || !Array.isArray(data.workout.exercises)) {
    throw new Error("Daily API returned incomplete content");
  }
  dailyCard.replaceChildren();

  const top = el("div", "daily-top");
  top.append(el("span", "daily-eyebrow", "TODAY'S FAITH + FITNESS"));
  top.append(el("span", "daily-date", `${data.date} · ${data.timeZone}`));
  dailyCard.append(top);
  dailyCard.append(el("h2", "daily-title", data.theme));
  dailyCard.append(el("h3", "daily-reference", `${data.verse.reference} · KJV`));
  dailyCard.append(el("blockquote", "daily-verse", data.verse.text));
  dailyCard.append(el("p", "daily-reflection", data.reflection));

  const workoutHeader = el("div", "daily-workout-heading");
  workoutHeader.append(el("h3", "", data.workout.title));
  workoutHeader.append(el("span", "daily-meta", `${data.workout.focus} · ${data.workout.minutes} min`));
  dailyCard.append(workoutHeader);

  const controls = el("div", "daily-controls");
  const levelLabel = el("label", "", "Workout level");
  levelLabel.htmlFor = "daily-level";
  const levelSelect = el("select", "daily-select");
  levelSelect.id = "daily-level";
  for (const [value, title] of [["beginner", "Beginner"], ["regular", "Regular"]]) {
    const option = el("option", "", title);
    option.value = value;
    levelSelect.append(option);
  }
  levelSelect.value = savedValue("kjv-nfc-level", "beginner") === "regular" ? "regular" : "beginner";
  controls.append(levelLabel, levelSelect);
  dailyCard.append(controls);

  const list = el("div", "daily-exercises");
  const progress = el("p", "daily-progress");
  dailyCard.append(list, progress);

  // Progress is separate for each server-provided date and difficulty level.
  // Saved indexes refer to exercise positions; changing their order can affect saved progress.
  function drawExercises() {
    const level = levelSelect.value;
    const storageKey = `kjv-nfc-progress-${data.date}-${level}`;
    // Ignore malformed JSON; keep only integer indexes from an array.
    let completed = [];
    try {
      const stored = JSON.parse(savedValue(storageKey, "[]"));
      if (Array.isArray(stored)) completed = stored.filter(Number.isInteger);
    } catch { /* Invalid saved progress is ignored. */ }
    list.replaceChildren();
    const checkboxes = [];

    // Store checked positions locally; no completion data is sent to the server.
    function update() {
      const done = checkboxes.flatMap((checkbox, index) => checkbox.checked ? [index] : []);
      saveValue(storageKey, JSON.stringify(done));
      progress.textContent = `${done.length} of ${checkboxes.length} movements complete`;
    }

    data.workout.exercises.forEach((exercise, index) => {
      const row = el("label", "daily-exercise");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = completed.includes(index);
      checkbox.addEventListener("change", update);
      const name = el("span", "daily-exercise-name", exercise.name);
      const amount = el("span", "daily-exercise-amount", exercise[level] || "As comfortable");
      row.append(checkbox, name, amount);
      list.append(row);
      checkboxes.push(checkbox);
    });
    progress.textContent = `${checkboxes.filter(box => box.checked).length} of ${checkboxes.length} movements complete`;
  }

  levelSelect.addEventListener("change", () => {
    saveValue("kjv-nfc-level", levelSelect.value);
    drawExercises();
  });
  drawExercises();

  dailyCard.append(el("p", "daily-caution", "Move at a comfortable pace. Rest as needed and stop if you feel pain or dizziness. Adjust exercises to your abilities."));

  // Link to the creator's profile separately from any individual daily workout video.
  // A profile link is always available; videoUrl remains empty until a matching video is chosen.
  const creatorLink = el("a", "daily-tiktok-profile", "Follow @djephthah on TikTok");
  creatorLink.href = "https://www.tiktok.com/@djephthah";
  creatorLink.target = "_blank";
  creatorLink.rel = "noopener noreferrer";
  dailyCard.append(creatorLink);

  // Only offer HTTPS TikTok links. Malformed or other-host links are silently omitted.
  if (typeof data.videoUrl === "string" && data.videoUrl) {
    try {
      const url = new URL(data.videoUrl);
      if (url.protocol === "https:" && (url.hostname === "tiktok.com" || url.hostname.endsWith(".tiktok.com"))) {
        const link = el("a", "daily-video", "Watch today's workout on TikTok");
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        dailyCard.append(link);
      }
    } catch { /* Do not display invalid links. */ }
  }
}

// A failed daily request gets its own retry button; random verses remain independent.
async function loadDaily() {
  try {
    const response = await fetch("/api/daily", { cache: "no-store" });
    if (!response.ok) throw new Error(`Daily API returned HTTP ${response.status}`);
    renderDaily(await response.json());
  } catch {
    dailyCard.replaceChildren();
    dailyCard.append(el("p", "daily-error", "Today's plan couldn't be loaded. Your New verse button still works below."));
    const retry = el("button", "btn ghost", "Retry today's plan");
    retry.type = "button";
    retry.addEventListener("click", loadDaily);
    dailyCard.append(retry);
  }
}

loadDaily();
loadVerse();

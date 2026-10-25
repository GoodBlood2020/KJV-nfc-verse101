// Curated KJV verses are served locally: daily scans do not depend on an external Bible API.
// Content follows the calendar date in America/Chicago for a consistent daily experience.
const TIME_ZONE = "America/Chicago";

const VERSES = [
  { reference: "1 Corinthians 9:24", text: "Know ye not that they which run in a race run all, but one receiveth the prize? So run, that ye may obtain.", theme: "Purpose", reflection: "Choose one small action you can take with purpose today." },
  { reference: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me.", theme: "Strength", reflection: "Remember where your strength and hope are rooted." },
  { reference: "Psalm 118:24", text: "This is the day which the LORD hath made; we will rejoice and be glad in it.", theme: "Gratitude", reflection: "Notice one reason to be thankful before you begin." },
  { reference: "Proverbs 16:3", text: "Commit thy works unto the LORD, and thy thoughts shall be established.", theme: "Commitment", reflection: "Bring your plans to God and take the next faithful step." },
  { reference: "Galatians 6:9", text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.", theme: "Perseverance", reflection: "Progress comes from returning to what matters." },
  { reference: "Isaiah 40:31", text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", theme: "Renewal", reflection: "Rest and patience can be parts of a faithful routine." },
  { reference: "Psalm 46:10", text: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.", theme: "Rest", reflection: "Make room for quiet and reflection today." },
  { reference: "2 Timothy 1:7", text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", theme: "Courage", reflection: "Approach today's challenge with steadiness, not fear." },
  { reference: "Philippians 3:14", text: "I press toward the mark for the prize of the high calling of God in Christ Jesus.", theme: "Focus", reflection: "Keep your attention on the next meaningful step." },
  { reference: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", theme: "Confidence", reflection: "Begin with courage; adjust the pace to your ability." },
  { reference: "James 1:4", text: "But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.", theme: "Patience", reflection: "Consistency can be quiet and gradual." },
  { reference: "Romans 12:12", text: "Rejoicing in hope; patient in tribulation; continuing instant in prayer;", theme: "Hope", reflection: "Return to prayer and encouragement when the day is difficult." },
  { reference: "Hebrews 12:11", text: "Now no chastening for the present seemeth to be joyous, but grievous: nevertheless afterward it yieldeth the peaceable fruit of righteousness unto them which are exercised thereby.", theme: "Discipline", reflection: "Consider the difference between healthy discipline and pushing too hard." },
  { reference: "John 14:27", text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.", theme: "Peace", reflection: "Let this moment be grounded in peace, not pressure." }
];

// 0 = Sunday. A repeatable, beginner-friendly week with strength, cardio and recovery.
const WORKOUTS = [
  { title: "Recovery and Reflection", focus: "Gentle recovery", minutes: "10–20", exercises: [
    { name: "Easy walk (optional)", beginner: "5–10 minutes", regular: "10–20 minutes" },
    { name: "Gentle shoulder rolls", beginner: "1 × 8", regular: "2 × 8" },
    { name: "Comfortable stretching", beginner: "2 minutes", regular: "5 minutes" }
  ] },
  { title: "Full-Body Foundation", focus: "Strength", minutes: "15–25", exercises: [
    { name: "Chair squats", beginner: "1 × 8", regular: "2 × 10" },
    { name: "Wall push-ups", beginner: "1 × 8", regular: "2 × 10" },
    { name: "Standing calf raises", beginner: "1 × 10", regular: "2 × 12" },
    { name: "March in place", beginner: "2 minutes", regular: "4 minutes" }
  ] },
  { title: "Cardio and Endurance", focus: "Cardio", minutes: "10–25", exercises: [
    { name: "Comfortable-pace walk", beginner: "8 minutes", regular: "18 minutes" },
    { name: "Easy side steps", beginner: "1 minute", regular: "3 minutes" },
    { name: "Slow walk to cool down", beginner: "2 minutes", regular: "4 minutes" }
  ] },
  { title: "Upper-Body Focus", focus: "Strength", minutes: "15–20", exercises: [
    { name: "Wall push-ups", beginner: "1 × 8", regular: "3 × 8" },
    { name: "Shoulder-blade squeezes", beginner: "1 × 10", regular: "2 × 12" },
    { name: "Wall plank hold", beginner: "2 × 15 seconds", regular: "3 × 25 seconds" },
    { name: "Gentle arm circles", beginner: "30 seconds", regular: "1 minute" }
  ] },
  { title: "Mobility and Reset", focus: "Active recovery", minutes: "10–15", exercises: [
    { name: "Easy walk", beginner: "5 minutes", regular: "10 minutes" },
    { name: "Gentle torso turns", beginner: "1 × 8", regular: "2 × 8" },
    { name: "Ankle circles", beginner: "1 × 8 per side", regular: "2 × 8 per side" }
  ] },
  { title: "Lower-Body Focus", focus: "Strength", minutes: "15–25", exercises: [
    { name: "Chair squats", beginner: "1 × 8", regular: "3 × 10" },
    { name: "Standing calf raises", beginner: "1 × 10", regular: "2 × 15" },
    { name: "Supported step-backs", beginner: "1 × 6 per side", regular: "2 × 8 per side" },
    { name: "Easy walk", beginner: "3 minutes", regular: "5 minutes" }
  ] },
  { title: "Movement and Core", focus: "Cardio + core", minutes: "15–25", exercises: [
    { name: "March in place", beginner: "3 minutes", regular: "6 minutes" },
    { name: "Standing opposite arm-knee reaches", beginner: "1 × 8", regular: "2 × 12" },
    { name: "Wall plank hold", beginner: "2 × 15 seconds", regular: "3 × 25 seconds" },
    { name: "Comfortable-pace walk", beginner: "5 minutes", regular: "10 minutes" }
  ] }
];

export function getDailyContent(instant = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(instant);
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const year = Number(fields.year), month = Number(fields.month), day = Number(fields.day);
  const utcDay = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const verse = VERSES[((utcDay % VERSES.length) + VERSES.length) % VERSES.length];
  return {
    date, timeZone: TIME_ZONE,
    verse: { reference: verse.reference, text: verse.text, translation: "KJV" },
    theme: verse.theme, reflection: verse.reflection,
    workout: WORKOUTS[weekday], videoUrl: null
  };
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  return res.status(200).json(getDailyContent());
}

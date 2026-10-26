// Read the latest published NAS video from a public media bucket.
// Nothing is published until the bucket URL is configured in Vercel.
// No NAS network ports or storage credentials are needed by this read-only endpoint.
const EXERCISES = {
  "chest-fly": { title: "Dumbbell Chest Fly", reference: "Galatians 6:9" },
  "pull-ups": { title: "Pull Ups", reference: "Philippians 3:14" }
};

function mediaBase() {
  const configured = process.env.DAILY_LIFT_MEDIA_BASE_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured.endsWith("/") ? configured : configured + "/");
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    return url;
  } catch { return null; }
}

// A manifest contains only a filename, not an arbitrary URL. This ensures that
// a compromised manifest cannot redirect viewers to a different host.
export function parsePublishedVideo(data, base) {
  if (!data || typeof data !== "object" || typeof data.videoKey !== "string" ||
      typeof data.date !== "string") return null;
  const match = /^videos\/daily-lift-(\d{4}-\d{2}-\d{2})-(chest-fly|pull-ups)\.mp4$/.exec(data.videoKey);
  if (!match || match[1] !== data.date) return null;
  const date = new Date(data.date + "T00:00:00Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date) return null;
  const exercise = EXERCISES[match[2]];
  return {
    available: true,
    date: data.date,
    title: exercise.title,
    reference: exercise.reference,
    videoUrl: new URL(data.videoKey, base).href
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const base = mediaBase();
  if (!base) return res.status(200).json({ available: false });

  try {
    const response = await fetch(new URL("latest.json", base), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) throw new Error("Manifest unavailable");
    const body = await response.text();
    if (body.length > 2048) throw new Error("Manifest too large");
    const video = parsePublishedVideo(JSON.parse(body), base);
    if (!video) throw new Error("Manifest invalid");
    return res.status(200).json(video);
  } catch {
    // Failed uploads and unavailable storage must never take the website down.
    return res.status(200).json({ available: false });
  }
}

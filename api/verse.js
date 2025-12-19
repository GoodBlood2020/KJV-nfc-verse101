import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'verses.kjv.references.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  const ref = data.verses[Math.floor(Math.random() * data.verses.length)];
  const refUrl = encodeURIComponent(ref).replace(/%20/g, '+');

  const response = await fetch(
    `https://dailybible.ca/api/${refUrl}?translation=kjv`
  );
  const verse = await response.json();

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    reference: verse.reference || ref,
    text: verse.text,
    source: 'KJV public domain'
  });
}

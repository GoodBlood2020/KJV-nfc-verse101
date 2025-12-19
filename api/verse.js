import verses from './verses.kjv.references.json';

export default function handler(req, res) {
  const verse = verses[Math.floor(Math.random() * verses.length)];
  res.status(200).json(verse);
}

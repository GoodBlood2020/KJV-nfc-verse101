async function loadVerse() {
  const res = await fetch('/api/verse', { cache: 'no-store' });
  const data = await res.json();
  document.getElementById('ref').innerText = data.reference;
  document.getElementById('verse').innerText = data.text;
}
loadVerse();

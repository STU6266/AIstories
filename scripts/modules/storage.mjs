// storage.mjs
// Minimaler LocalStorage-Layer für "Beste Stories".
// Wir speichern pro Eintrag: { text, image, rating, date }

export function saveBestStory(text, image, rating, date) {
  // 1) Bestehende Liste lesen (oder leeres Array)
  const bestStories = JSON.parse(localStorage.getItem('bestStories')) || [];
  // 2) Neuen Eintrag anhängen
  bestStories.push({ text, image, rating, date });
  // 3) Zurückschreiben (als JSON-String)
  localStorage.setItem('bestStories', JSON.stringify(bestStories));
}

export function getBestStories() {
  try {
    // Defensive: JSON kann kaputt sein → try/catch
    const raw = localStorage.getItem('bestStories');
    const data = JSON.parse(raw) || [];
    // Nur Arrays akzeptieren (sonst lieber leeres Array zurück)
    return Array.isArray(data) ? data : [];
  } catch {
    // Z. B. SyntaxError beim JSON.parse → sicherer Fallback
    return [];
  }
}

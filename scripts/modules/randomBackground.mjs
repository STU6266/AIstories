// randomBackground.mjs
// Aufgabe: Beim Seitenstart einen optisch ansprechenden Hintergrund setzen.
// 1) Wenn "random.json" verfügbar: zufälliges Bild aus /images/ wählen.
// 2) Fallback: ein hübscher Farbverlauf, falls Liste fehlt oder etwas schiefgeht.

export function initRandomBackground() {
  // Das Overlay-DIV ist in der index.html als fixe Ebene im Hintergrund vorhanden.
  const overlay = document.getElementById('bg-overlay');
  if (!overlay) return; // Falls das Element fehlt, leise abbrechen (kein Crash im JS)

  // Versuch, die Bildliste zu laden
  fetch('random.json')
    .then(r => {
      if (!r.ok) throw new Error(`Cannot load image list (status ${r.status}).`);
      return r.json(); // Annahme: JSON-Array wie ["bg1.jpg", "bg2.jpg", ...]
    })
    .then(images => {
      // Prüfen, ob es ein nicht-leeres Array ist
      if (!Array.isArray(images) || images.length === 0) throw new Error('Image list empty.');
      // Zufälligen Index wählen und Hintergrund setzen
      const idx = Math.floor(Math.random() * images.length);
      overlay.style.backgroundImage = `url('images/${images[idx]}')`;
    })
    .catch(() => {
      // Fallback (z. B. wenn random.json fehlt oder network error):
      // Farbverlauf, damit die Seite nie „leer“ aussieht.
      overlay.style.backgroundImage =
        'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
    });
}

import { getBestStories } from './storage.mjs';

// Kleiner Formatter: \n → <br> für die Anzeige in Cards
function formatText(text) {
  return String(text || '').replace(/\n/g, '<br>');
}

export function renderBestStories() {
  const container = document.getElementById('bestStoriesContainer');
  const stories = getBestStories();  // Array oder []

  if (!Array.isArray(stories) || stories.length === 0) return; // leer → Platzhalter lassen

  // Wenn eine "No stories yet"-Card existiert: entfernen
  const placeholder = container.querySelector('.noStoriesCard');
  if (placeholder) placeholder.remove();

  // Neueste zuerst anzeigen
  stories.slice().reverse().forEach(story => {
    // Rating & Datum aufbereiten
    const rating = Number(story?.rating || 0);
    const savedAt = story?.date ? new Date(story.date) : new Date();
    const when = isNaN(savedAt.getTime()) ? '' : savedAt.toLocaleString();

    // Sterne-String zusammenbauen (z. B. ★★★☆☆)
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const aria = `Rated ${rating} out of 5`;

    // Card-Element erstellen
    const card = document.createElement('div');
    card.className = 'storyCard';
    card.setAttribute('role', 'listitem'); // A11y
    card.tabIndex = 0;

    // Inhalt der Card (Bild, Text, Sterne, Meta)
    card.innerHTML = `
      <img
        src="${story?.image || ''}"                /* kann data: oder https: sein */
        alt="Saved story illustration"
        width="220" height="124" loading="lazy"
        style="max-width:220px;border-radius:1rem;box-shadow:0 1px 8px rgba(0,0,0,0.10);margin-bottom:1rem;">
      <div class="storyText">${formatText(story?.text)}</div>
      <div class="ratingStars" aria-label="${aria}" style="font-size:1.2rem;margin:0.6rem 0;">${stars}</div>
      <div class="storyMeta">Saved on: ${when}</div>
    `;

    container.appendChild(card);
  });
}

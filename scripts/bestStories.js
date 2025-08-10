function formatText(text) {
  return String(text || '').replace(/\n/g, '<br>');
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('bestStoriesContainer');
  const raw = localStorage.getItem('bestStories');
  let stories = [];

  try {
    stories = JSON.parse(raw) || [];
  } catch (_) {
    stories = [];
  }


  if (!Array.isArray(stories) || stories.length === 0) {
   
    return;
  }

  const placeholder = container.querySelector('.noStoriesCard');
  if (placeholder) placeholder.remove();

  stories.slice().reverse().forEach(story => {
    const rating = Number(story?.rating || 0);
    const safeText = formatText(story?.text);
    const savedAt = story?.date ? new Date(story.date) : new Date();
    const when = isNaN(savedAt.getTime()) ? '' : savedAt.toLocaleString();

    const card = document.createElement('div');
    card.className = 'storyCard';

    card.setAttribute('role', 'listitem');
    card.tabIndex = 0;

    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const aria = `Rated ${rating} out of 5`;

    card.innerHTML = `
      <img
        src="${story?.image || ''}"
        alt="Saved story illustration"
        width="220" height="124" loading="lazy"
        style="max-width: 220px; border-radius: 1rem; box-shadow: 0 1px 8px rgba(0,0,0,0.10); margin-bottom: 1rem;">
      <div class="storyText">${safeText}</div>
      <div class="ratingStars" aria-label="${aria}" style="font-size:1.2rem;margin:0.6rem 0;">${stars}</div>
      <div class="storyMeta">Saved on: ${when}</div>
    `;

    container.appendChild(card);
  });
  
});

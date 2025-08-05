
function formatText(text) {
  return text.replace(/\n/g, "<br>");
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('bestStoriesContainer');
  const stories = JSON.parse(localStorage.getItem('bestStories')) || [];

  if (stories.length === 0) {
    container.innerHTML = "<p>No stories saved yet.</p>";
    return;
  }
  stories.reverse();

  stories.forEach(story => {

    const card = document.createElement('div');
    card.className = 'storyCard';

    card.innerHTML = `
      <img src="${story.image}" alt="Story illustration" style="max-width: 220px; border-radius: 1rem; box-shadow: 0 1px 8px rgba(0,0,0,0.10); margin-bottom: 1rem;">
      <div class="storyText">${formatText(story.text)}</div>
      <div class="ratingStars" style="color:#FFC857; font-size:1.3rem; margin:0.5rem 0;">
        ${'★'.repeat(story.rating)}${'☆'.repeat(5 - story.rating)}
      </div>
      <div class="storyMeta" style="color: #888; font-size:0.9rem;">
        Saved on: ${new Date(story.date).toLocaleString()}
      </div>
    `;

    container.appendChild(card);
  });
});

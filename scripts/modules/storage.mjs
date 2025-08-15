export function saveBestStory(text, image, rating, date) {
  const bestStories = JSON.parse(localStorage.getItem('bestStories')) || [];
  bestStories.push({ text, image, rating, date });
  localStorage.setItem('bestStories', JSON.stringify(bestStories));
}

export function getBestStories() {
  try {
    const raw = localStorage.getItem('bestStories');
    const data = JSON.parse(raw) || [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
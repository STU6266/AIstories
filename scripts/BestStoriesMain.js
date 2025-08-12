import { initRandomBackground } from './modules/randomBackground.mjs';
import { renderBestStories } from './modules/bestStoriesView.mjs';

initRandomBackground();
renderBestStories();
document.getElementById('year').textContent = new Date().getFullYear();

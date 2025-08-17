import { initRandomBackground } from './modules/randomBackground.mjs';
import { renderBestStories } from './modules/bestStoriesView.mjs';

initRandomBackground();                           // Optik auch auf der BestStories-Seite
renderBestStories();                              // holt localStorage + baut Kartenliste
document.getElementById('year').textContent = new Date().getFullYear(); // Footer aktuell halten

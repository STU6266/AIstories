// scripts/modules/config.mjs
// Wähle die API-Base je nach Umgebung.
// 1) Wenn window.__API_BASE__ gesetzt ist, nimm die.
// 2) Lokal (localhost/127.0.0.1) nimm localhost:3000
// 3) Sonst nimm fest deine Render-URL.

export const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__)
    ? window.__API_BASE__
    : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'https://aistories.onrender.com'; // <- DEIN Render-Service
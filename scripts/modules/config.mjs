// scripts/modules/config.mjs
// Wähle die API-Base je nach Umgebung.
// 1) Wenn window.__API_BASE__ gesetzt ist, nimm die.
// 2) Lokal (localhost/127.0.0.1) nimm localhost:3000
// 3) Sonst nimm fest deine Render-URL.

// scripts/modules/config.mjs
function normalizeBase(u) {
  if (!u) return '';
  // "https://https://domain" -> "https://domain", abschließende Slashes weg
  return u.replace(/^https?:\/\/https?:\/\//i, 'https://').replace(/\/+$/,'');
}

const computed =
  (typeof window !== 'undefined' && window.__API_BASE__)
    ? window.__API_BASE__
    : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'https://aistories.onrender.com';

export const API_BASE = normalizeBase(computed);

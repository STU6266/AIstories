// Very small guard so images don't break the UI if the proxy soft-fails
function placeholderDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225">
    <rect width="100%" height="100%" fill="#ececec"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          font-family="sans-serif" font-size="16" fill="#999">
      Image not available
    </text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// keep the sanitizer minimal on client side
function sanitizePrompt(raw) {
  const txt = String(raw || '').replace(/\s+/g, ' ').trim();
  return (txt.slice(0, 300) || 'calm scenic illustration') +
         '. friendly, non-violent, no text, soft light';
}

export async function generateImage(prompt) {
  try {
    const r = await fetch('http://localhost:3000/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: sanitizePrompt(prompt) })
    });

    let data = {};
    try { data = await r.json(); } catch { /* ignore */ }

    const url =
      data?.imageUrl ||
      data?.url ||
      data?.data?.[0]?.url ||
      null;

    return url || placeholderDataUrl();
  } catch {
    return placeholderDataUrl();
  }
}
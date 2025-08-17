// openai-proxy.js  — CommonJS + global fetch (Node 18+)
// Zweck: Localhost-Proxy, der Requests vom Browser annimmt, an OpenAI weitergibt
// und die Antworten normalisiert (z. B. immer imageUrl zurück).

require('dotenv').config();               // Lädt Umgebungsvariablen aus .env (OPENAI_API_KEY)
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());                          // Erlaubt Cross-Origin-Requests (wichtig fürs Frontend)
app.use(express.json({ limit: '2mb' }));  // JSON-Body-Parser mit Limit

// Lies den OpenAI-API-Key aus der .env
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY in .env'); // Früher Hinweis statt späterer 401/403
}

// --------------------------- Helfer ----------------------------------------

// Minimale Prompt-„Hygiene“: einige Wörter ersetzen, Länge begrenzen.
// (Das ist bewusst sehr einfach gehalten.)
function sanitizePrompt(p = '') {
  if (typeof p !== 'string') return '';
  return p
    .replace(/\b(blood|gore|explicit|nsfw)\b/gi, 'soft light') // harsche Begriffe „entschärfen“
    .slice(0, 1200);                                          // Request klein halten
}

// Fallback-Bild (SVG als Data-URL), falls OpenAI nicht liefert.
// Vorteil: Der Client kann IMMER sofort etwas anzeigen, ohne weitere Netzwerkkosten.
function placeholderDataUri(msg) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
      <rect width="100%" height="100%" fill="#eee"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial" font-size="28" fill="#888">
        ${msg || 'Image not available'}
      </text>
    </svg>`;
  // Als data:image/svg+xml;base64,... zurückgeben
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ----------------------- TEXT: /api/generate-story -------------------------
// Erwartet vom Client: { messages } oder { prompt, context }
// Baut ggf. messages selbst und ruft dann OpenAI Chat Completions.
// Antwort wird 1:1 weitergereicht, weil dein Frontend dieses Format bereits erwartet.
app.post('/api/generate-story', async (req, res) => {
  try {
    let { messages, prompt, context } = req.body || {};

    // Convenience: Wenn nur 'prompt' geliefert wurde, messages automatisch bauen.
    if (!Array.isArray(messages) && prompt) {
      messages = [
        { role: 'system', content: 'You are an interactive story engine.' }, // Rollen-Priming
        ...(Array.isArray(context) ? context : []),                          // optionaler Verlauf/Kontext
        { role: 'user', content: prompt }                                    // eigentlicher User-Input
      ];
    }

    // Minimale Validierung
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided.' });
    }

    // Upstream-Call zu OpenAI Chat
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,   // Auth
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',                        // leicht & günstig, gut genug für Kapitel
        temperature: 0.9,                            // kreativ, aber nicht wild
        messages                                     
      })
    });

    const data = await r.json();
    if (!r.ok) {
      // Bei Fehlern gib die OpenAI-Struktur zurück, damit du im Frontend debuggen kannst
      console.error('OpenAI Chat error:', data);
      return res.status(500).json({ error: data });
    }
    // Erfolgsfall: rohes OpenAI-JSON an den Client
    res.json(data);
  } catch (err) {
    console.error('Proxy text error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- IMAGE: /api/generate-image ---------------------------
// Erwartet { prompt } vom Frontend, ruft OpenAI Images (DALL·E 3) auf.
// Gibt IMMER { imageUrl } zurück: entweder echte PNG-Data-URL oder SVG-Platzhalter.
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body || {};

    // Leicht „entschärfter“ Prompt + harmlose Stilhinweise
    const safePrompt =
      (sanitizePrompt(prompt) || 'soft, friendly illustration, PG-rated, watercolor')
      + ', high quality, no violence, no explicit content';

    // Request an OpenAI Images API
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',            // aktuelles Modell
        prompt: safePrompt,           // unser bereinigter Prompt
        n: 1,                         // genau 1 Bild
        size: '1024x1024',            // DALL·E 3 akzeptiert 1024er Formate
        response_format: 'b64_json'   // base64 zurück (keine Hotlinks)
      })
    });

    const data = await r.json();

    if (!r.ok) {
      // Fehler von OpenAI → kontrollierter Fallback (SVG)
      console.error('OpenAI Image error:', data);
      const msg = data?.error?.message || 'content policy violation';
      return res.json({ imageUrl: placeholderDataUri(msg) });
    }

    // base64 aus der OpenAI-Antwort ziehen
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.json({ imageUrl: placeholderDataUri('No image in response') });

    // Data-URL zurück an den Browser
    res.json({ imageUrl: `data:image/png;base64,${b64}` });
  } catch (err) {
    // Unerwartete Exceptions (Netz down etc.) → ebenfalls Platzhalter
    console.error('Proxy image error:', err);
    return res.json({ imageUrl: placeholderDataUri('Image service unavailable') });
  }
});

// ----------------------------- Start ---------------------------------------
const PORT = 3000;
console.log('Proxy started', { file: __filename, mode: 'image:b64_json' });
app.listen(PORT, () => console.log(`Proxy listening on http://localhost:${PORT}`));

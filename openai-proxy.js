require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json({ limit: '2mb' }));

// --- CORS: exakt deine Origins erlauben + OPTIONS beantworten
const ALLOWED = new Set([
  'https://stu0206.github.io', // deine GitHub Pages Domain
  'https://stu6266.github.io', // falls du diesen Account auch nutzt
  'http://localhost:5500',     // optional lokal (Live Server)
  'http://localhost:1234'      // optional lokal
]);

app.use((req, res, next) => {
  const origin = (req.headers.origin || '').toLowerCase();

  // Debug ins Render-Log (hilft, falls sich die Origin unterscheidet)
  if (origin) console.log('CORS origin:', origin);

  if (ALLOWED.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin); // exakt zurückgeben
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end(); // Preflight OK
  next();
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) console.error('❌ Missing OPENAI_API_KEY in .env');

const sanitize = p =>
  (String(p || '').replace(/\s+/g, ' ').trim().slice(0, 1200) ||
   'calm scenic illustration, friendly, no text, soft light');

const placeholder = msg => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <rect width="100%" height="100%" fill="#eee"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      font-family="Arial" font-size="28" fill="#888">${(msg||'Image not available').replace(/</g,'&lt;')}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// ---- TEXT ----
app.post('/api/generate-story', async (req, res) => {
  try {
    let { messages, prompt, context } = req.body || {};
    if (!Array.isArray(messages) && prompt) {
      messages = [
        { role: 'system', content: 'You are an interactive story engine.' },
        ...(Array.isArray(context) ? context : []),
        { role: 'user', content: String(prompt) }
      ];
    }
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'No messages provided.' });
    }
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.9, messages })
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- IMAGE ----
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size } = req.body || {};
    const clean = sanitize(prompt);

    async function call(model, sz) {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, prompt: clean, size: sz, n: 1 })
      });
      const text = await r.text();
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return { ok: r.ok, status: r.status, data };
    }

    const allowedGpt = new Set(['256x256','512x512','1024x1024']);
    const szGpt = allowedGpt.has(String(size)) ? size : '512x512';

    let resp = await call('gpt-image-1', szGpt);
    const modelErr = !resp.ok && (resp.data?.error?.param === 'model' ||
      String(resp.data?.error?.message||'').toLowerCase().includes('unknown'));
    if (modelErr) resp = await call('dall-e-3', '1024x1024');

    if (!resp.ok) {
      console.error('OpenAI Image error:', resp.status, resp.data?.error || resp.data);
      const q = encodeURIComponent((clean || 'fantasy concept art').slice(0, 100));
      return res.json({ imageUrl: `https://source.unsplash.com/1024x1024/?${q}` });
    }

    const url = resp.data?.data?.[0]?.url || null;
    const b64 = resp.data?.data?.[0]?.b64_json || null;
    if (url) return res.json({ imageUrl: url });
    if (b64) return res.json({ imageUrl: `data:image/png;base64,${b64}` });
    return res.json({ imageUrl: placeholder('No image in response') });
  } catch (err) {
    console.error('Proxy image exception:', err);
    res.json({ imageUrl: placeholder('Image service unavailable') });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy listening on :${PORT}`));

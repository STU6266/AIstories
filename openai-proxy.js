// openai-proxy.js  — CommonJS + global fetch (Node 18+)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY in .env');
}

// --- helpers ---------------------------------------------------------------
function sanitizePrompt(p = '') {
  if (typeof p !== 'string') return '';
  return p.replace(/\b(blood|gore|explicit|nsfw)\b/gi, 'soft light').slice(0, 1200);
}
function placeholderDataUri(msg) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
      <rect width="100%" height="100%" fill="#eee"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial" font-size="28" fill="#888">
        ${msg || 'Image not available'}
      </text>
    </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// --- TEXT: /api/generate-story --------------------------------------------
app.post('/api/generate-story', async (req, res) => {
  try {
    let { messages, prompt, context } = req.body || {};
    if (!Array.isArray(messages) && prompt) {
      messages = [
        { role: 'system', content: 'You are an interactive story engine.' },
        ...(Array.isArray(context) ? context : []),
        { role: 'user', content: prompt }
      ];
    }
    if (!Array.isArray(messages) || messages.length === 0) {
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
    if (!r.ok) {
      console.error('OpenAI Chat error:', data);
      return res.status(500).json({ error: data });
    }
    res.json(data);
  } catch (err) {
    console.error('Proxy text error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- IMAGE: /api/generate-image -------------------------------------------
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    const safePrompt =
      (sanitizePrompt(prompt) || 'soft, friendly illustration, PG-rated, watercolor')
      + ', high quality, no violence, no explicit content';

    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: safePrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
      })
    });

    const data = await r.json();

    if (!r.ok) {
      console.error('OpenAI Image error:', data);
      const msg = data?.error?.message || 'content policy violation';
      return res.json({ imageUrl: placeholderDataUri(msg) });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.json({ imageUrl: placeholderDataUri('No image in response') });

    res.json({ imageUrl: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error('Proxy image error:', err);
    return res.json({ imageUrl: placeholderDataUri('Image service unavailable') });
  }
});

// --- start -----------------------------------------------------------------
const PORT = 3000;
console.log('Proxy started', { file: __filename, mode: 'image:b64_json' });
app.listen(PORT, () => console.log(`Proxy listening on http://localhost:${PORT}`));
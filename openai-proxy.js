require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/generate', async (req, res) => {
  try {
    let { messages, prompt, context } = req.body;
    if (!messages && prompt) {
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
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.9
      })
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

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
      })
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('OpenAI Image error:', data);
      return res.status(500).json({ error: data });
    }

    const b64 = data?.data?.[0]?.b64_json || null;
    if (!b64) return res.status(500).json({ error: 'No image in response' });

    const imageUrl = `data:image/png;base64,${b64}`;
    res.json({ imageUrl });
  } catch (err) {
    console.error('Proxy image error:', err);
    res.status(500).json({ error: err.message });
  }
});
const PORT = 3000;

console.log('Proxy started', { file: __filename, mode: 'image:b64_json' });
app.listen(PORT, () => console.log(`Proxy listening on http://localhost:${PORT}`));

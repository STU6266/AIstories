
require('dotenv').config(); // .env Datei laden
// openai-proxy.js
const express = require('express');
// const fetch = require('node-fetch'); // v2 verwenden!
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, context = [] } = req.body;
    const messages = [
      { role: 'system', content: 'You are a creative storytelling engine.' },
      ...context,
      { role: 'user', content: prompt }
    ];
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        temperature: 0.8,
        max_tokens: 500
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Neuen Endpunkt für Bildgenerierung
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body; // Der Bild-Textprompt
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "dall-e-3",  // Alternativ: "dall-e-2"
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI Image error:', data);
      return res.status(500).json({ error: data });
    }
    res.json(data);
  } catch (err) {
    console.error('Proxy image error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Proxy listening on http://localhost:${PORT}`));

// storyAPI.js

/**
 * Ruft deinen lokalen OpenAI-Proxy-Server auf,
 * um ein neues Story-Kapitel zu generieren.
 *
 * @param {string} prompt  - Die Eingabe für die KI (was als nächstes passieren soll)
 * @param {Array} context  - (Optional) Bisherige Story-/Entscheidungsverlauf als Array
 * @returns {Promise<string>} - Der generierte Story-Text
 */
async function generateChapter(prompt, context = []) {
  // Wir schicken die Anfrage jetzt an unser eigenes Backend (Proxy)
  const response = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt,
      context: context
    })
  });

  if (!response.ok) {
    throw new Error(`Proxy API error: ${response.status}`);
  }

  // Die API-Antwort enthält das OpenAI-Ergebnis als JSON.
  const data = await response.json();
  // Extrahiere den Text des AI-Kapitels aus der Antwort.
  return data.choices[0].message.content.trim();
}

// Beispielaufruf (kannst du auskommentieren oder fürs Testen nutzen)
/*
generateChapter('The adventure begins in a mysterious forest...')
  .then(text => {
    console.log('Generated chapter:', text);
    // Oder in dein UI einfügen, z.B.:
    // document.getElementById('chapters').innerText = text;
  })
  .catch(error => {
    alert('Error generating story: ' + error.message);
  });
*/

/**
 * Fordert ein AI-Bild von deinem lokalen Proxy an.
 * @param {string} prompt - Beschreibung, was auf dem Bild sein soll
 * @returns {Promise<string>} - Die URL des generierten Bildes
 */
async function generateImage(prompt) {
  const response = await fetch('http://localhost:3000/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await response.json();
  // Die DALL·E-API liefert ein Objekt mit einem "data"-Array:
  // [ { url: 'https://...' } ]
  if (data && data.data && data.data[0] && data.data[0].url) {
    return data.data[0].url;
  } else {
    throw new Error("No image generated");
  }
}

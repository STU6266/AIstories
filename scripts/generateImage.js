/**
 * @param {string} prompt
 * @returns {Promise<string>} 
 */
async function generateImage(prompt) {
  const response = await fetch('http://localhost:3000/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await response.json();

  if (data && data.data && data.data[0] && data.data[0].url) {
    return data.data[0].url;
  } else {
    throw new Error("No image generated");
  }
}

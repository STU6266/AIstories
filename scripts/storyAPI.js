
/**
 * @param {string} prompt
 * @param {Array} context
 * @returns {Promise<string>}
 */
async function generateChapter(prompt, context = []) {

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

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

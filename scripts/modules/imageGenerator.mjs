export async function generateImage(prompt) {
  const r = await fetch('http://localhost:3000/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await r.json();

  const dataUrl = data?.imageUrl;
  const directUrl = data?.url;
  const urlFromArray = data?.data?.[0]?.url;

  if (dataUrl) return dataUrl;
  if (directUrl) return directUrl;
  if (urlFromArray) return urlFromArray;

  throw new Error('No image generated');
}

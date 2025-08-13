// scripts/modules/randomBackground.mjs
export function initRandomBackground() {
  const overlay = document.getElementById('bg-overlay');
  if (!overlay) return;

  fetch('random.json')
    .then(r => {
      if (!r.ok) throw new Error(`Cannot load image list (status ${r.status}).`);
      return r.json();
    })
    .then(images => {
      if (!Array.isArray(images) || images.length === 0) throw new Error('Image list empty.');
      const idx = Math.floor(Math.random() * images.length);
      overlay.style.backgroundImage = `url('images/${images[idx]}')`;
    })
    .catch(() => {
      overlay.style.backgroundImage =
        'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
    });
}

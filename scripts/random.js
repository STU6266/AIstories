
document.addEventListener('DOMContentLoaded', () => {

  const overlay = document.getElementById('bg-overlay');
  if (!overlay) {
    console.error('Could not find the background overlay element (#bg-overlay).');
    return;
  }

  fetch('random.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Cannot load image list (status ${response.status}).`);
      }

      return response.json();
    })
    .then(images => {
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error('Image list is empty or not valid.');
      }

      const randomIndex = Math.floor(Math.random() * images.length);
      overlay.style.backgroundImage = `url('images/${images[randomIndex]}')`;
    })
    .catch(error => {
      console.error('Error setting up background image:', error);
    });

  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});

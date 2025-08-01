// We wait until the browser has finished creating the page content
// so that all HTML elements exist before we try to work with them.
document.addEventListener('DOMContentLoaded', () => {
  // 1) Find the “background overlay” DIV in our page.
  //    This is an empty box we placed behind everything in <main>
  //    where we’ll show our picture.
  const overlay = document.getElementById('bg-overlay');
  // If we can’t find it, we stop and log an error so we know something went wrong.
  if (!overlay) {
    console.error('Could not find the background overlay element (#bg-overlay).');
    return;
  }

  // 2) Load the list of all image file names from our manifest.
  //    This manifest lives at images/random.json and simply lists
  //    every image you want us to choose from.
  fetch('random.json')
    .then(response => {
      // If the server says “not OK” (like a 404 error), we throw an error.
      if (!response.ok) {
        throw new Error(`Cannot load image list (status ${response.status}).`);
      }
      // Otherwise, we read the response as JSON (a list/array we can use in code).
      return response.json();
    })
    .then(images => {
      // 3) Now we have our list of image file names.
      //    We check it’s actually an array with at least one picture.
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error('Image list is empty or not valid.');
      }
      // 4) Pick one at random.
      //    For example, if there are 10 images, we pick a number 0–9.
      const randomIndex = Math.floor(Math.random() * images.length);
      // 5) Finally, tell our overlay box to use that image as its background.
      //    This will show the picture behind all our panels.
      overlay.style.backgroundImage = `url('images/${images[randomIndex]}')`;
      // The CSS for #bg-overlay has opacity 0.5, so it’s semi-transparent.
    })
    .catch(error => {
      // If anything went wrong above—network error, empty list, etc.—
      // we log it here so we can debug. The page will simply show
      // the overlay’s fallback background color instead.
      console.error('Error setting up background image:', error);
      // Optionally, we could set a default image here:
      // overlay.style.backgroundImage = "url('images/default.jpg')";
    });

  // 6) Finally, update the footer year.
  //    We find the <span id="year"> and put in the current year (e.g. “2025”).
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Holt das Formular und das Story-Ausgabefeld
  const setupForm = document.getElementById('setupForm');
  const storyBox = document.getElementById('storyBox');

  setupForm.addEventListener('submit', async function(event) {
    event.preventDefault(); // Verhindert, dass die Seite neu lädt

    // Liest alle Parameter aus den Formularelementen aus
    const theme = document.getElementById('themeSelect').value;
    const violence = document.getElementById('violence').value;
    const humor = document.getElementById('humor').value;
    const romance = document.getElementById('romance').value;
    const fantasy = document.getElementById('fantasy').value;
    const darkness = document.getElementById('realism').value;
    const emotion = document.getElementById('emotion').value;
    const duration = document.getElementById('duration').value;

    // Baut den Prompt für GPT zusammen
    const prompt =
      `Write an interactive story in the theme of "${theme}".\n` +
      `The story should have these characteristics (on a scale from 0 to 10):\n` +
      `- Violence: ${violence}/10\n` +
      `- Humor: ${humor}/10\n` +
      `- Romance: ${romance}/10\n` +
      `- Fantasy: ${fantasy}/10\n` +
      `- Darkness: ${darkness}/10\n` +
      `- Emotion: ${emotion}/10\n` +
      `The story should take about ${duration} minutes to read and play. Start the story.`;

    // Zeigt einen Ladehinweis an
    storyBox.innerText = "Generating your story, please wait...";

    try {
      // Schickt den Prompt an deinen Proxy (der an GPT weiterleitet)
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          context: []
        })
      });

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        const storyText = data.choices[0].message.content;
        storyBox.innerText = storyText;

        // --- Bildgenerierung starten ---
        // Holt das <img> Element (sollte in deinem HTML existieren)
        const imgElem = document.getElementById('storyImage');
        if (imgElem) {
          imgElem.alt = "Generating image...";
          // Prompt für das Bild zusammenbauen
          generateImage("An illustration of the following story scene: " + storyText)
            .then(url => {
              imgElem.src = url;
              imgElem.alt = "Story illustration";
            })
            .catch(err => {
              imgElem.alt = "No image could be generated: " + err.message;
              imgElem.removeAttribute('src');
            });
        }
      } else {
        storyBox.innerText = "Sorry, no story was generated. Please try again.";
        // Optional: Bild leeren, falls kein Text generiert wurde
        const imgElem = document.getElementById('storyImage');
        if (imgElem) imgElem.removeAttribute('src');
      }

    } catch (err) {
      storyBox.innerText = "Error generating story: " + err.message;
    }
  });
});

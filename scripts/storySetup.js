document.addEventListener('DOMContentLoaded', () => {
  const setupForm = document.getElementById('setupForm');
  const storyBox = document.getElementById('storyBox');
  const storyPanel = document.getElementById('story');
  const chaptersContainer = document.getElementById('chapters');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  let currentChapter = 0;
  let allChapters = [];

  function updateProgressBar(current, total) {
    let percent = 0;
    if (total > 0) {
      percent = Math.round((current / total) * 100);
    }
    progressBar.style.width = percent + "%";
    progressText.textContent = percent + "%";
  }

  setupForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const theme = document.getElementById('themeSelect').value;
    const age = document.getElementById('age').value;
    const violence = document.getElementById('violence').value;
    const humor = document.getElementById('humor').value;
    const romance = document.getElementById('romance').value;
    const fantasy = document.getElementById('fantasy').value;
    const darkness = document.getElementById('realism').value;
    const emotion = document.getElementById('emotion').value;
    const duration = document.getElementById('duration').value;

    const prompt =
      `Write an interactive story for a person who is ${age} years old. The story should be appropriate and engaging for this age group.\n` +
      `Theme: "${theme}".\n` +
      `The story should have these characteristics (on a scale from 0 to 10):\n` +
      `- Violence: ${violence}/10\n` +
      `- Humor: ${humor}/10\n` +
      `- Romance: ${romance}/10\n` +
      `- Fantasy: ${fantasy}/10\n` +
      `- Darkness: ${darkness}/10\n` +
      `- Emotion: ${emotion}/10\n` +
      `The story should take about ${duration} minutes to read and play. Start the story.`;

    storyBox.innerText = "Generating your story, please wait...";
    chaptersContainer.innerHTML = '<div class="chapter-placeholder" style="min-height:180px;">Generating story...</div>';
    updateProgressBar(0, 1);

    try {
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
        allChapters = splitChapters(storyText);

        currentChapter = 1;
        showChapters();

        const imgElem = document.getElementById('storyImage');
        if (imgElem) {
          imgElem.alt = "Generating image...";
          imgElem.setAttribute('width', 400);
          imgElem.setAttribute('height', 225);

          generateImage("An illustration of the following story scene: " + allChapters[0])
            .then(url => {
              imgElem.src = url;
              imgElem.alt = "Story illustration";
            })
            .catch(err => {
              imgElem.alt = "No image could be generated: " + err.message;
              imgElem.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225'%3E%3Crect width='400' height='225' fill='%23ececec'/%3E%3Ctext x='200' y='120' font-size='20' text-anchor='middle' fill='%23ccc'%3ENo%20Image%3C/text%3E%3C/svg%3E";
            });
        }
      } else {
        chaptersContainer.innerHTML = "Sorry, no story was generated. Please try again.";
        updateProgressBar(0, 1);
        const imgElem = document.getElementById('storyImage');
        if (imgElem) imgElem.removeAttribute('src');
      }

    } catch (err) {
      chaptersContainer.innerHTML = "Error generating story: " + err.message;
      updateProgressBar(0, 1);
    }
  });

  function showChapters() {
    chaptersContainer.innerHTML = "";
    for (let i = 0; i < currentChapter; i++) {
      const chapterDiv = document.createElement('div');
      chapterDiv.className = 'chapter';
      chapterDiv.innerHTML = formatText(allChapters[i]);
      chaptersContainer.appendChild(chapterDiv);
    }
    updateProgressBar(currentChapter, allChapters.length);
    addNextButtonIfNeeded();
  }

  function addNextButtonIfNeeded() {
    removeNextButton();
    if (currentChapter < allChapters.length) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = "Next Chapter";
      nextBtn.className = "btn";
      nextBtn.id = "nextChapterBtn";
      nextBtn.style.margin = "1rem auto";
      nextBtn.onclick = () => {
        currentChapter++;
        showChapters();
      };
      chaptersContainer.appendChild(nextBtn);
    }
  }

  function removeNextButton() {
    const btn = document.getElementById('nextChapterBtn');
    if (btn) btn.remove();
  }

  function formatText(text) {
    return text.replace(/\n/g, "<br>");
  }

  function splitChapters(storyText) {
    if (storyText.includes('###')) {
      return storyText.split(/###\s*/).filter(Boolean);
    }
    return storyText.split(/\n\s*\n/).filter(Boolean);
  }

  const ratingBox = document.getElementById('ratingBox');
  const stars = ratingBox.querySelectorAll('.star');
  let userRating = 0;

  stars.forEach(star => {
    star.addEventListener('click', function() {
      userRating = parseInt(this.dataset.value);
      stars.forEach((s, i) => {
        s.classList.toggle('selected', i < userRating);
      });
      document.getElementById('ratingMessage').textContent = `You rated this story ${userRating} stars.`;

      if (userRating >= 4) {
        saveBestStory();
        document.getElementById('ratingMessage').textContent += " Story saved to Best Stories!";
      }
    });
  });

  function saveBestStory() {
    let storyText = allChapters.join('\n\n');
    const storyImage = document.getElementById('storyImage').src;
    const date = new Date().toISOString();

    let bestStories = JSON.parse(localStorage.getItem('bestStories')) || [];

    bestStories.push({
      text: storyText,
      image: storyImage,
      rating: userRating,
      date: date
    });

    localStorage.setItem('bestStories', JSON.stringify(bestStories));
  }
});

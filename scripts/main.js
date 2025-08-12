import { initRandomBackground } from './modules/randomBackground.mjs';
import { buildFinalPrompt } from './modules/promptBuilder.mjs';
import { getRandomSettings } from './modules/randomSetups.mjs';
import { generateStoryFromContext } from './modules/storyApi.mjs';
import { generateImage } from './modules/imageGenerator.mjs';
import { startTimer, stopTimer, setTimerDisplay, onTick } from './modules/timer.mjs';
import { saveBestStory } from './modules/storage.mjs';
import { typeWriter, updateProgressBar } from './modules/ui.mjs';

initRandomBackground();

const setupForm = document.getElementById('setupForm');
const chaptersContainer = document.getElementById('chapters');
const choicesContainer = document.getElementById('choices');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const storyImage = document.getElementById('storyImage');
const historyList = document.getElementById('historyList');
const timerEl = document.getElementById('timer');

const ratingBox = document.getElementById('ratingBox');
const ratingMessage = document.getElementById('ratingMessage');
const stars = document.querySelectorAll('#ratingBox .star');

const initialImageSrc = storyImage.src;
let storyHistory = [];
let currentStory = {};
let storySaved = false;
let totalSeconds = 0;
let elapsedSeconds = 0;

document.getElementById('history').classList.add('hidden');
ratingBox.classList.add('hidden');

function percent() {
  if (totalSeconds <= 0) return 0;
  return Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));
}

onTick((secElapsed, secTotal) => {
  elapsedSeconds = secElapsed;
  totalSeconds = secTotal;
  setTimerDisplay(timerEl, Math.max(0, totalSeconds - elapsedSeconds));
  updateProgressBar(progressBar, progressText, percent());
});

setupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  document.getElementById('setup').classList.add('hidden');
  document.getElementById('story').classList.remove('hidden');

  const ageRaw = document.getElementById('age').value;
  const durationRaw = document.getElementById('duration').value;
  const userSettings = {
    theme: document.getElementById('themeSelect').value,
    age: Number.isFinite(parseInt(ageRaw, 10)) ? parseInt(ageRaw, 10) : 18,
    violence: document.getElementById('violence').value,
    humor: document.getElementById('humor').value,
    romance: document.getElementById('romance').value,
    fantasy: document.getElementById('fantasy').value,
    darkness: document.getElementById('darkness').value,
    emotion: document.getElementById('emotion').value,
    duration: Number.isFinite(parseInt(durationRaw, 10)) ? parseInt(durationRaw, 10) : 30
  };

  startTimer(userSettings.duration);

  storyHistory = [{ role: 'system', content: 'You are an interactive story engine.' }];
  const prompt = buildFinalPrompt(userSettings, getRandomSettings(Number(userSettings.duration), Number(userSettings.age)));
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    alert('ERROR: Prompt is empty or invalid.');
    return;
  }
  storyHistory.push({ role: 'user', content: prompt });

  chaptersContainer.innerHTML = '';
  updateProgressBar(progressBar, progressText, 0);

  await generateNextChapter();
});

async function generateNextChapter() {
  chaptersContainer.innerHTML += `<div class="chapter loading-chapter">Loading next chapter...</div>`;
  choicesContainer.innerHTML = '';

  let data;
  try {
    data = await generateStoryFromContext(storyHistory);
  } catch (_) {
    const loaders = chaptersContainer.querySelectorAll('.loading-chapter');
    loaders.forEach(el => el.remove());
    chaptersContainer.innerHTML += `<div class="chapter">Error loading story. Please try again.</div>`;
    return;
  }

  const loaders = chaptersContainer.querySelectorAll('.loading-chapter');
  loaders.forEach(el => el.remove());

  if (data?.choices?.[0]?.message?.content) {
    showChapterAndChoices(data.choices[0].message.content);
  } else {
    chaptersContainer.innerHTML += `<div class="chapter">Error loading story. Please try again.</div>`;
  }
}

function showChapterAndChoices(responseText) {
  const chapterTextArr = [];
  const choicesArr = [];
  const lines = responseText.split('\n').filter(l => l.trim().length > 0);

  let choicesStarted = false;
  for (let line of lines) {
    if (/^\s*([-\[\(]?\d+[\]\)]?)|(- )/i.test(line)) {
      choicesArr.push(line.replace(/^\s*([-\[\(]?\d+[\]\)]?)|(- )\s*/i, ''));
      choicesStarted = true;
    } else if (!choicesStarted) {
      chapterTextArr.push(line);
    }
  }

  const newChapterDiv = document.createElement('div');
  newChapterDiv.className = 'chapter';
  chaptersContainer.appendChild(newChapterDiv);
  typeWriter(newChapterDiv, chapterTextArr.join('\n'));

  if (chapterTextArr.length > 0) {
    const chapterText = chapterTextArr.join(' ');
    generateImage(chapterText).then(imageUrl => {
      storyImage.src = imageUrl;
    });
  }

  choicesContainer.innerHTML = '';
  if (choicesArr.length > 0) {
    choicesArr.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice;
      btn.className = 'btn';
      btn.onclick = () => {
        storyHistory.push({ role: 'user', content: 'The user chose: ' + choice });
        generateNextChapter();
      };
      choicesContainer.appendChild(btn);
    });
  } else {
    choicesContainer.innerHTML = '<span>Story finished! 🎉</span>';
    const storyText = Array.from(document.querySelectorAll('.chapter')).map(ch => ch.innerText).join('\n\n');
    currentStory = { text: storyText, image: storyImage.src, date: Date.now() };
    ratingBox.classList.remove('hidden');
    document.getElementById('history').classList.remove('hidden');

    if (historyList.querySelector('li') && historyList.querySelector('li').innerText.includes('No stories yet')) {
      historyList.innerHTML = '';
    }
    const themeName = currentStory && currentStory.text ? (currentStory.text.split('\n')[0] || 'Story') : 'Story';
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const li = document.createElement('li');
    li.textContent = `${themeName} - ${timeString}`;
    historyList.appendChild(li);
    stopTimer();
  }
}

stars.forEach(star => {
  star.addEventListener('mouseover', () => {
    const val = parseInt(star.dataset.value);
    stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value) <= val));
  });
});
ratingBox.addEventListener('mouseleave', () => {
  if (!storySaved) stars.forEach(s => s.classList.remove('selected'));
  else if (currentStory.rating) {
    stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value) <= currentStory.rating));
  }
});
stars.forEach(star => {
  star.addEventListener('click', () => {
    if (storySaved) return;
    const ratingVal = parseInt(star.dataset.value);
    stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value) <= ratingVal));
    ratingMessage.textContent = 'Story saved!';
    currentStory.rating = ratingVal;
    saveBestStory(currentStory.text, currentStory.image, ratingVal, currentStory.date);
    storySaved = true;
  });
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!currentStory.text) return;
  const blob = new Blob([currentStory.text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'story.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('themeSwitch').addEventListener('change', (e) => {
  document.body.classList.toggle('dark', e.target.value === 'dark');
});

const htmlEl = document.documentElement;
document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
  htmlEl.classList.remove('small-font', 'medium-font', 'large-font');
  if (e.target.value === 'small') htmlEl.classList.add('small-font');
  else if (e.target.value === 'large') htmlEl.classList.add('large-font');
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('story').classList.add('hidden');
  document.getElementById('setup').classList.remove('hidden');
  document.getElementById('history').classList.add('hidden');
  ratingBox.classList.add('hidden');
  chaptersContainer.innerHTML = '<div class="chapter-placeholder" style="min-height:180px;">Your story will appear here...</div>';
  choicesContainer.innerHTML = '';
  storyImage.src = initialImageSrc;
  storySaved = false;
  currentStory = {};
  historyList.innerHTML = '<li style="min-height:48px;">No stories yet.</li>';
  stopTimer();
  updateProgressBar(progressBar, progressText, 0);
});

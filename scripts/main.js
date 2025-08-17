// ---------- Imports: Jede Funktion hat ihre klare Zuständigkeit ----------
import { initRandomBackground } from './modules/randomBackground.mjs'; // setzt Hintergrund (random.json → images/)
import { buildFinalPrompt } from './modules/promptBuilder.mjs';       // baut den großen Start-Prompt (Regeln + User-Werte)
import { getRandomSettings } from './modules/randomSetups.mjs';       // liefert Zufalls-Parameter / Setups
import { generateStoryFromContext } from './modules/storyApi.mjs';    // ruft /api/generate-story (Proxy → OpenAI Chat)
import { generateImage } from './modules/imageGenerator.mjs';         // ruft /api/generate-image (Proxy → OpenAI Images)
import { startTimer, stopTimer, setTimerDisplay, onTick } from './modules/timer.mjs'; // Timer/Progressbar-Helfer
import { saveBestStory } from './modules/storage.mjs';                // persistiert fertige Story in localStorage
import { typeWriter, updateProgressBar } from './modules/ui.mjs';     // UI-Animationen (Schreiben, Progress-Füllung)
import { parseChapterAndChoices, stripMarkdown } from './modules/parser.mjs'; // parst AI-Text → { chapterText, choices[] }

initRandomBackground(); // Optik: sofort ein Hintergrundbild/Gradient statt „blankem“ Start

// ---------- DOM-Referenzen: einmal anfassen, wiederverwenden ----------
const setupForm = document.getElementById('setupForm');
const chaptersContainer = document.getElementById('chapters');   // Container für Kapiteldivs
const choicesContainer = document.getElementById('choices');     // Container für Choice-Buttons
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const storyImage = document.getElementById('storyImage');        // großes Kapitelbild
const historyList = document.getElementById('historyList');      // rechte Leiste mit Verlauf/Beste Stories
const timerEl = document.getElementById('timer');

const ratingBox = document.getElementById('ratingBox');          // ⭐︎-Bewertungsbereich
const ratingMessage = document.getElementById('ratingMessage');
const stars = document.querySelectorAll('#ratingBox .star');     // alle Sternchen

const initialImageSrc = storyImage.src;                          // für Reset: ursprüngliches Bild merken

// ---------- App-Status (State) ----------
let storyHistory = [];   // vollständiger Chat-Verlauf (system+user+assistant). Dient als Kontext für das Modell.
let currentStory = {};   // fertige Story (Text + Bild + Datum + Rating)
let storySaved = false;  // verhindert Mehrfach-Speichern beim Rating
let totalSeconds = 0;    // Dauer aus der Form (für Progress)
let elapsedSeconds = 0;  // bereits vergangene Zeit
let chapterNumber = 1;   // Kapitel-Zähler (steuert System-Hinweis bei Fortsetzung)

document.getElementById('history').classList.add('hidden'); // rechte Leiste am Anfang ausblenden
ratingBox.classList.add('hidden');                          // Bewertungsbereich erst am Ende zeigen

/* Helpers */
// Prozent für Progressbar: elapsed / total * 100 (abgeriegelt)
function percent() {
  if (totalSeconds <= 0) return 0;
  return Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));
}

// Timer-Events → UI updaten (Restlaufzeit + Fortschrittsbalken)
onTick((secElapsed, secTotal) => {
  elapsedSeconds = secElapsed;                        // globaler Stand
  totalSeconds = secTotal;
  setTimerDisplay(timerEl, Math.max(0, totalSeconds - elapsedSeconds)); // mm:ss anzeigen
  updateProgressBar(progressBar, progressText, percent());              // Progressbar füllen
});

// Finale erkennen: Wenn der AI-Text am Ende „The end/Final chapter/Epilogue“ enthält, ist Schluss.
function isFinalChapter(text) {
  return /(^|\n)\s*(the\s+end|final\s+chapter|epilogue)\s*$/i.test(text);
}

// System-Note, die das Modell zuverlässig in das NÄCHSTE Kapitel lenkt.
// Sie enthält: Kapitelnummer, Format („Chapter N: <Your Title>“), danach „Choices:“ + Bullet-Points.
// Wichtig: „Do not restart at Chapter 1“ verhindert Neustarts; keine Zusammenfassung gewünscht.
function pushNextChapterSystemNote() {
  storyHistory.push({
    role: 'system',
    content:
      `Continue the existing story in exactly one new chapter titled "Chapter ${chapterNumber}: <Your Title>".
After the chapter, output the line "Choices:" and then 3–5 bullet choices (e.g., "- Do X").
Do not restart at Chapter 1. Do not summarize previous chapters.`
  });
}

/* Flow */

// 1) Start-Formular: Eingaben einsammeln, Prompt bauen, Timer starten, Kapitel 1 holen
setupForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // klassisches Single-Page-Form-Verhalten: kein Full-Page-Reload

  // Setup-Bereich verstecken, Story-Bereich zeigen
  document.getElementById('setup').classList.add('hidden');
  document.getElementById('story').classList.remove('hidden');

  // Benutzer-Inputs lesen (Strings → Zahlen normalisieren)
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

  // Timer starten (steuert Fortschrittsbalken)
  startTimer(userSettings.duration);
  chapterNumber = 1; // Kapitelzählung zurücksetzen

  // Gespräch für das Modell aufbauen
  storyHistory = [{ role: 'system', content: 'You are an interactive story engine.' }];

  // Master-Prompt erzeugen: Regeln + User-Settings + Zufalls-Setups
  const prompt = buildFinalPrompt(
    userSettings,
    getRandomSettings(Number(userSettings.duration), Number(userSettings.age))
  );
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    alert('ERROR: Prompt is empty or invalid.');
    return; // harte Abbruchbedingung: ohne Prompt keine Story
  }
  storyHistory.push({ role: 'user', content: prompt });

  // UI bereinigen und Fortschritt auf 0
  chaptersContainer.innerHTML = '';
  updateProgressBar(progressBar, progressText, 0);

  // Erstes Kapitel holen
  await generateNextChapter();
});

// 2) Ein Kapitel vom Modell holen (Proxy → OpenAI), robust gegen Fehler
async function generateNextChapter() {
  // Visueller Loader
  chaptersContainer.innerHTML += `<div class="chapter loading-chapter">Loading next chapter...</div>`;
  choicesContainer.innerHTML = '';

  let data;
  try {
    data = await generateStoryFromContext(storyHistory); // ruft /api/generate-story
  } catch (_) {
    // Unerwarteter Fehler → Loader entfernen, Benutzerfreundliche Meldung zeigen
    const loaders = chaptersContainer.querySelectorAll('.loading-chapter');
    loaders.forEach(el => el.remove());
    chaptersContainer.innerHTML += `<div class="chapter">Error loading story. Please try again.</div>`;
    return;
  }

  // Loader entfernen
  const loaders = chaptersContainer.querySelectorAll('.loading-chapter');
  loaders.forEach(el => el.remove());

  // OpenAI Chat Completions liefern typischerweise: data.choices[0].message.content
  const full = data?.choices?.[0]?.message?.content;
  if (!full || typeof full !== 'string') {
    chaptersContainer.innerHTML += `<div class="chapter">Error loading story. Please try again.</div>`;
    return;
  }

  // Verlauf erweitern (damit der nächste Request den Kontext kennt)
  storyHistory.push({ role: 'assistant', content: full });

  // Text + Choices anzeigen
  showChapterAndChoices(full);
}

// 3) Kapitel-Text anzeigen, Bild holen, Choice-Buttons rendern
function showChapterAndChoices(responseText) {
  // Finale? → nur anzeigen + finishStory()
  if (isFinalChapter(responseText)) {
    renderChapterOnly(responseText);
    finishStory();
    return;
  }

  // AI-Text in Kapiteltext + Choices zerlegen
  const { chapterText, choices } = parseChapterAndChoices(responseText);

  // Kapiteltext rendern (mit Typewriter-Effekt)
  const newChapterDiv = document.createElement('div');
  newChapterDiv.className = 'chapter';
  chaptersContainer.appendChild(newChapterDiv);
  // Falls Parser nichts gefunden hat, fallback auf den originalen AI-Text
  typeWriter(newChapterDiv, (chapterText || responseText).trim());

  // Bild-Propt aus dem Kapiteltext bilden (kleine Säuberung) und /api/generate-image aufrufen
  const forImage = (chapterText || responseText).replace(/\s+/g, ' ').trim();
  if (forImage) {
    generateImage(forImage)
      .then(url => { if (url) storyImage.src = url; }) // URL kann echte https:// oder data:image/png;base64 sein
      .catch(() => {});                                 // Fehler → still (Platzhalter kommt aus imageGenerator)
  }

  // Choice-Buttons aufbauen. Wenn weniger als 2, dann Fallback „Continue“ (lineare Fortsetzung)
  choicesContainer.innerHTML = '';
  if (choices.length >= 2) {
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice;
      btn.className = 'btn';
      btn.onclick = () => {
        // Wahl in den Verlauf schreiben (sehr wichtig: beeinflusst das nächste Kapitel)
        storyHistory.push({ role: 'user', content: 'The user chose: ' + choice });
        chapterNumber += 1;            // Zähler erhöhen
        pushNextChapterSystemNote();   // Systeminstruktion für „nächstes Kapitel + Choices“
        generateNextChapter();         // wieder von vorne (ohne Seite neu zu laden)
      };
      choicesContainer.appendChild(btn);
    });
  } else {
    const btn = document.createElement('button');
    btn.textContent = 'Continue';
    btn.className = 'btn';
    btn.onclick = () => {
      storyHistory.push({ role: 'user', content: 'Continue the story with the next chapter.' });
      chapterNumber += 1;
      pushNextChapterSystemNote();
      generateNextChapter();
    };
    choicesContainer.appendChild(btn);
  }
}

// 4) Nur Text anzeigen (für das finale Kapitel ohne Choices)
function renderChapterOnly(text) {
  const div = document.createElement('div');
  div.className = 'chapter';
  chaptersContainer.appendChild(div);
  typeWriter(div, text.trim());
}

// 5) Am Ende: Story einsammeln, Speichern/Rating ermöglichen, Timer stoppen
function finishStory() {
  choicesContainer.innerHTML = '<span>Story finished! 🎉</span>';

  // Sichtbaren Text aller Kapitel holen (innerText) und mit Leerzeilen verbinden
  const storyText = Array.from(document.querySelectorAll('.chapter'))
    .map(ch => ch.innerText)
    .join('\n\n');

  // aktuelle Story für Export/Speichern
  currentStory = { text: storyText, image: storyImage.src, date: Date.now() };

  // Bewertungsbereich + Historie sichtbar schalten
  ratingBox.classList.remove('hidden');
  document.getElementById('history').classList.remove('hidden');

  // Rechtes Panel: den Platzhalter entfernen und einen Listenpunkt hinzufügen
  if (historyList.querySelector('li') && historyList.querySelector('li').innerText.includes('No stories yet')) {
    historyList.innerHTML = '';
  }
  const themeName = currentStory && currentStory.text ? (currentStory.text.split('\n')[0] || 'Story') : 'Story';
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const li = document.createElement('li');
  li.textContent = `${themeName} - ${timeString}`;
  historyList.appendChild(li);

  stopTimer(); // Fortschrittsbalken einfrieren
}

/* 6) Rating & Settings (Sterne, Export, Theme, Schriftgröße, Reset) */

// Hover: Sterne visuell vor-auswählen
stars.forEach(star => {
  star.addEventListener('mouseover', () => {
    const val = parseInt(star.dataset.value);
    stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value) <= val));
  });
});

// Maus verlässt Box → Zustand zurück (oder auf gespeicherten Wert)
ratingBox.addEventListener('mouseleave', () => {
  if (!storySaved) stars.forEach(s => s.classList.remove('selected'));
  else if (currentStory.rating) {
    stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value) <= currentStory.rating));
  }
});

// Klick: Einmalig speichern (localStorage) + Nachricht zeigen
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

// Export als .txt mittels Blob + temporärem <a>-Download-Link
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

// Theme-Switch: toggelt Klasse 'dark' am <body>
document.getElementById('themeSwitch').addEventListener('change', (e) => {
  document.body.classList.toggle('dark', e.target.value === 'dark');
});

// Schriftgrößenwechsel: Klassen am <html>
// Vorteil: du kannst in CSS gezielt auf .small-font/.large-font reagieren.
const htmlEl = document.documentElement;
document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
  htmlEl.classList.remove('small-font', 'medium-font', 'large-font');
  if (e.target.value === 'small') htmlEl.classList.add('small-font');
  else if (e.target.value === 'large') htmlEl.classList.add('large-font');
});

// Alles zurück auf Anfang (UI + State), ohne localStorage zu löschen
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('story').classList.add('hidden');
  document.getElementById('setup').classList.remove('hidden');
  document.getElementById('history').classList.add('hidden');
  ratingBox.classList.add('hidden');
  // Platzhalter-Text wieder einsetzen: damit die Fläche nicht „springt“
  chaptersContainer.innerHTML = '<div class="chapter-placeholder" style="min-height:180px;">Your story will appear here...</div>';
  choicesContainer.innerHTML = '';
  storyImage.src = initialImageSrc;
  storySaved = false;
  currentStory = {};
  chapterNumber = 1;
  stopTimer();
  updateProgressBar(progressBar, progressText, 0);
});


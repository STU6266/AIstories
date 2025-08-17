// ui.mjs
// Kleine, fokussierte UI-Helfer:
// 1) typeWriter(element, text, speed): schreibt Text Buchstabe für Buchstabe ins DOM.
// 2) updateProgressBar(barEl, labelEl, pct): setzt Breite/Aria-Value + Labeltext.

export function typeWriter(element, text, speed = 22) {
  element.innerHTML = ''; // Ziel leeren
  let i = 0;

  // Sofort selbstaufrufende Funktion, die sich mit setTimeout rekursiv aufruft.
  (function typing() {
    if (i < text.length) {
      // \n werden durch <br> ersetzt, damit Zeilenumbrüche sichtbar sind.
      element.innerHTML += text[i] === '\n' ? '<br>' : text[i];
      i++;
      setTimeout(typing, speed); // nächster "Tastendruck" nach <speed> ms
    }
  })();
}

export function updateProgressBar(barEl, labelEl, pct) {
  // Prozentwert absichern: 0..100 als Ganzzahl
  const p = Math.max(0, Math.min(100, pct | 0));

  // Visuell: Breite der Füllung
  barEl.style.width = p + '%';

  // A11y: aria-valuenow aktualisieren (Screenreader)
  barEl.setAttribute('aria-valuenow', String(p));

  // Label (z. B. "42%")
  labelEl.textContent = p + '%';
}

// timer.mjs
// Ein sehr kleiner globaler Timer mit Listener-Mechanik:
// - startTimer(minutes): startet/setzt die Gesamtdauer (_total) und zählt jede Sekunde hoch.
// - onTick(fn): registriert Callback, der immer (elapsed, total) bekommt.
// - stopTimer(): stoppt den Intervall.
// - setTimerDisplay(el, sec): Hilfsfunktion zur mm:ss-Anzeige.

let _interval = null;  // Referenz auf setInterval, um es später clearen zu können
let _listeners = [];   // Array registrierter Callback-Funktionen
let _elapsed = 0;      // bereits vergangene Sekunden
let _total = 0;        // Gesamtsekunden

// Registriert einen Tick-Listener; wird bei jeder Sekunde aufgerufen.
export function onTick(fn) {
  if (typeof fn === 'function') _listeners.push(fn);
}

// Ruft alle Listener mit dem aktuellen Stand auf.
function emit() {
  _listeners.forEach(fn => fn(_elapsed, _total));
}

// Startet/Resetet den Timer auf "minutes" Minuten.
export function startTimer(minutes) {
  const m = Math.max(1, parseInt(minutes || 30, 10)); // Minimum 1 Minute
  _total = m * 60;
  _elapsed = 0;

  // Vorherigen Timer stoppen (falls schon einer läuft)
  stopTimer();

  // Jede Sekunde _elapsed erhöhen, Listener feuern, ggf. automatisch stoppen.
  _interval = setInterval(() => {
    _elapsed += 1;
    if (_elapsed > _total) _elapsed = _total; // Kappen auf den Maximalwert
    emit();                                   // UI updaten (Progressbar, Restzeit)
    if (_elapsed >= _total) stopTimer();      // Ablauf erreicht → stoppen
  }, 1000);

  // Initialer Emit, damit UI direkt anzeigt (nicht erst nach 1 Sekunde)
  emit();
}

// Stoppt den Timer, wenn er läuft.
export function stopTimer() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}

// Hilfsfunktion: Sekunden als mm:ss in ein Element schreiben.
export function setTimerDisplay(el, sec) {
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  el.textContent = `${mm}:${String(ss).padStart(2, '0')}`;
}

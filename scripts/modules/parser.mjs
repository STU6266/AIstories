// parser.mjs
// Zweck dieses Moduls:
// 1) Markdown-ähnliche Formatierungen aus KI-Texten entfernen (stripMarkdown).
// 2) Einen vom Modell gelieferten Kapitel-Text in
//    a) reinen Kapiteltext und
//    b) eine Liste von Auswahlmöglichkeiten (choices[]) zerlegen.

/**
 * Entfernt gängige leichte Markdown-Formate aus einem String.
 * Das ist nützlich, weil die KI oft **Fettschrift**, *Kursiv*, `Code`, # Überschriften
 * oder [Links](url) in der Antwort verwendet. Für die Anzeige im Frontend
 * wollen wir aber reinen Text.
 */
export function stripMarkdown(s) {
  if (!s) return '';
  return s
    // **Fett** → nur Inhalt behalten
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // *Kursiv* → nur Inhalt behalten
    .replace(/\*(.*?)\*/g, '$1')
    // `Inline-Code` → nur Inhalt behalten
    .replace(/`([^`]+)`/g, '$1')
    // Markdown-Überschriften (#, ##, ...) am Zeilenanfang entfernen
    .replace(/^#{1,6}\s+/g, '')
    // [Text](Link) → nur "Text" behalten
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

/**
 * Zerlegt einen KI-Rohtext in { chapterText, choices }.
 * Der Parser ist bewusst defensiv:
 * - Er akzeptiert unterschiedliche "Choices:"-Markierungen (auch "What will you do?")
 * - Er erkennt Aufzählungen/-•-1. 2) (Liste an Anfängen) als Choices
 * - Er bricht ab, wenn ein neues Kapitel ("## Chapter N") beginnt
 */
export function parseChapterAndChoices(raw) {
  // 1) Robust gegen null/undefiniert: String casten, nach Zeilen splitten,
  //    rechte Leerzeichen entfernen, leere Zeilen verwerfen.
  const lines = String(raw || '')
    .split('\n')
    .map(l => l.trimEnd())
    .filter(Boolean);

  const chapter = []; // sammelt den Erzähltext
  const choices = []; // sammelt die Buttontexte

  // --- Erkennungsregeln (Regex) ---
  // a) Wann beginnt der Abschnitt, in dem Entscheidungen (Choices) gelistet sind?
  const choiceStartHints = /^(?:#{2,3}\s*choices\b|#{2,3}\s*what\s+will\s+you\s+do\??)/i;

  // b) Was gilt als "Bullet"-Zeile (Aufzählung) → zählt als Choice
  //    - " - Choice", "* Choice", "• Choice"
  //    - "1. Choice", "(1) Choice", "1) Choice", "[1] Choice"
  const bullet =
    /^\s*(?:[-*•]|(?:\(?\d+\)?|\[\d+\]|(?:\d+))[\.\)]?)\s+(.*)$/i;

  // c) Erkennung eines neuen Kapitels ("## Chapter 5" etc.)
  const nextChapter = /^#{2,3}\s*chapter\s+\d+/i;

  let inChoices = false; //-Steuerflag: sammeln wir bereits Choices?

  // --- Hauptschleife: Zeile für Zeile verarbeiten ---
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Wenn wir im Choices-Block sind und ein neues Kapitel beginnt: hier stoppen
    if (inChoices && nextChapter.test(line)) break;

    // Wechsel in den Choices-Block, sobald "## Choices" oder "## What will you do?"
    if (!inChoices && choiceStartHints.test(line)) {
      inChoices = true;
      continue; // Die Überschrift selbst ist keine Choice
    }

    // Prüfen, ob die aktuelle Zeile wie eine Choice-Aufzählung aussieht
    const m = line.match(bullet);
    if (m) {
      inChoices = true; // ab hier gilt: wir sind im Choices-Block
      // Strip Markdown aus dem eigentlichen Choice-Text
      const cleaned = stripMarkdown(m[1] || line);
      if (cleaned) choices.push(cleaned);
      continue;
    }

    // Standardfall: Solange wir noch nicht im Choices-Block sind → Kapiteltext
    if (!inChoices) {
      chapter.push(line);
    }
  }

  // Ergebnis: Zusammengefügter Kapiteltext + Choices-Liste.
  return {
    chapterText: chapter.join('\n').trim(),
    choices
  };
}

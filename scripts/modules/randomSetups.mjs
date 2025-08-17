// randomSetups.mjs
// Liefert optionale Zufalls-Einschübe, die den Prompt (und damit die Story)
// interessanter/variabler machen: Rätsel, Item-Wahlen, seltenes "Bad Ending".

export function getRandomSettings(duration, age) {
  // ----- 1) Anzahl möglicher Rätsel in Abhängigkeit der Gesamtdauer -----
  let maxPuzzles = 0;
  if (duration >= 61) maxPuzzles = 4;
  else if (duration >= 46) maxPuzzles = 3;
  else if (duration >= 31) maxPuzzles = 2;
  else if (duration >= 15) maxPuzzles = 1;

  // Zufällig 0..maxPuzzles wählen
  const numPuzzles = Math.floor(Math.random() * (maxPuzzles + 1));

  // ----- 2) Rätsel-Schwierigkeit nach Alter wählen -----
  let difficulty = 'any difficulty';
  if (age < 8) difficulty = 'very easy';
  else if (age < 13) difficulty = 'easy';
  else if (age < 17) difficulty = 'medium';
  else if (age < 40) difficulty = 'challenging';
  // (>=40 bleibt "any difficulty", was der KI Freiraum gibt)

  // Für jedes geplante Rätsel einen Hinweis-Text erzeugen.
  // Diese Texte landen später im Prompt als "PUZZLE #i: ..."
  const puzzleInserts = Array.from({ length: numPuzzles }, () =>
    `At the end of a random chapter, instead of choices, present a logic or word puzzle or riddle for the user to solve. The difficulty of the puzzle should be ${difficulty} for a person who is ${age} years old. Wait for the user to solve it before continuing the story.`
  );

  // ----- 3) Seltener Sonderfall: "Bad Ending" für jüngere Nutzer -----
  // Mit sehr kleiner Wahrscheinlichkeit (1/25) und nur bei <17 Jahren
  let rareBadEndingPrompt = '';
  if (age < 17 && Math.floor(Math.random() * 25) === 0) {
    rareBadEndingPrompt =
      'Important: No matter what choices the user makes, this story must end in a sad, devastating way. All choices should ultimately lead to an unhappy or tragic ending, even if the user tries to do everything right. Do not give any hints that this will happen. This should happen only very rarely, randomly for young users.';
  }

  // ----- 4) Item-Choice-Ereignisse -----
  // Wenn die Gesamtdauer groß genug ist (>=45 Minuten), erlaube bis zu 2 Item-Wahlen
  let maxItemChoices = duration >= 45 ? 2 : 0;
  const numItemChoices = Math.floor(Math.random() * (maxItemChoices + 1));
  const itemChoiceInserts = Array.from({ length: numItemChoices }, () =>
    `At a random chapter, instead of a normal decision or puzzle, let the user choose one item from 3 to 5 possible items. Only describe the items and do NOT say which one is important or useless. Later in the story, make sure that the chosen item either turns out to be very useful, or turns out to be unnecessary or disappointing, depending on the story direction and user choices. Sometimes the chosen item should have no benefit at all, while another unchosen item would have helped greatly. Be creative and vary which items are actually useful or not in each story.`
  );

  // Diese Struktur versteht promptBuilder.mjs und fügt es sauber in den Prompt ein.
  return { puzzleInserts, itemChoiceInserts, rareBadEndingPrompt };
}

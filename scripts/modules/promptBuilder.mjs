export function buildFinalPrompt(userSettings, randomSettings) {
  if (!userSettings || typeof userSettings !== 'object') userSettings = {};
  if (!randomSettings || typeof randomSettings !== 'object') randomSettings = {};

  let extraText = '';
  if (randomSettings.puzzleInserts && Array.isArray(randomSettings.puzzleInserts) && randomSettings.puzzleInserts.length > 0) {
    extraText += '\n' + randomSettings.puzzleInserts.map((p, i) => `PUZZLE #${i + 1}: ${p}`).join('\n');
  }
  if (randomSettings.itemChoiceInserts && Array.isArray(randomSettings.itemChoiceInserts) && randomSettings.itemChoiceInserts.length > 0) {
    extraText += '\n' + randomSettings.itemChoiceInserts.map((p, i) => `ITEM CHOICE #${i + 1}: ${p}`).join('\n');
  }
  if (randomSettings.rareBadEndingPrompt && typeof randomSettings.rareBadEndingPrompt === 'string') {
    extraText += '\n' + randomSettings.rareBadEndingPrompt;
  }

  const prompt =
    `Write an interactive, deep and meaningful story for a person who is ${userSettings.age || 'unknown'} years old.\n` +
    `The story should be engaging, with strong characters, consistent themes, and natural character development.\n\n` +
    `Theme: "${userSettings.theme || 'unknown'}".\n` +
    `Story characteristics (on a scale from 0 to 10):\n` +
    `- Violence: ${userSettings.violence || 0}/10\n` +
    `- Humor: ${userSettings.humor || 0}/10\n` +
    `- Romance: ${userSettings.romance || 0}/10\n` +
    `- Fantasy: ${userSettings.fantasy || 0}/10\n` +
    `- Darkness: ${userSettings.darkness || 0}/10\n` +
    `- Emotion: ${userSettings.emotion || 0}/10\n\n` +
    `At the end of every chapter, stop and present the user with a meaningful choice that will influence the story's direction.\n` +
    `Divide the story into chapters, each with a random length between 3 and 7 minutes of reading time. At the end of every chapter, pause and present the user with a random set of 3 to 5 distinct, meaningful choices for how the story should continue. The choices should be clearly different from each other and relevant to the current situation in the story. Wait for the user to select one before proceeding to the next chapter.\n` +
    `The total number of chapters and their lengths should add up to approximately ${userSettings.duration || 'unknown'} minutes, as specified by the user.\n\n` +
    `When you reach the final chapter, review the whole story and all user choices to deliver a satisfying and thoughtful ending that ties together all important threads and themes. Do not reveal planned endings before the last chapter.\n` +
    (extraText ? ('\n\n---\n\n' + extraText + '\n') : '') +
    `\nBegin with the first chapter now.`;

  return (typeof prompt === 'string' && prompt.trim().length > 0) ? prompt : 'Write an engaging interactive story.';
}

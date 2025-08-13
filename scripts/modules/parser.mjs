
export function stripMarkdown(s) {
  if (!s) return '';
  return s
    .replace(/\*\*(.*?)\*\*/g, '$1') 
    .replace(/\*(.*?)\*/g, '$1') 
    .replace(/`([^`]+)`/g, '$1') 
    .replace(/^#{1,6}\s+/g, '') 
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') 
    .trim();
}


export function parseChapterAndChoices(raw) {
  const lines = String(raw || '')
    .split('\n')
    .map(l => l.trimEnd())
    .filter(Boolean);

  const chapter = [];
  const choices = [];

  const choiceStartHints = /^(?:#{2,3}\s*choices\b|#{2,3}\s*what\s+will\s+you\s+do\??)/i;
  const bullet =
    /^\s*(?:[-*•]|(?:\(?\d+\)?|\[\d+\]|(?:\d+))[\.\)]?)\s+(.*)$/i;
  const nextChapter = /^#{2,3}\s*chapter\s+\d+/i;

  let inChoices = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inChoices && nextChapter.test(line)) break;

    if (!inChoices && choiceStartHints.test(line)) {
      inChoices = true;
      continue;
    }

    const m = line.match(bullet);
    if (m) {
      inChoices = true;
      const cleaned = stripMarkdown(m[1] || line);
      if (cleaned) choices.push(cleaned);
      continue;
    }

    if (!inChoices) {
      chapter.push(line);
    }
  }

  return {
    chapterText: chapter.join('\n').trim(),
    choices
  };
}

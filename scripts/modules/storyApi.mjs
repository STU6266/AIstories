// storyApi.mjs
// Aufgabe: Eine "sichere" Anfrage an deinen Proxy (/api/generate-story) aufbauen,
// die OpenAI-Response tolerant einliest und in ein bekanntes Format überführt.

export async function generateStoryFromContext(messages) {
  try {
    // 1) Eingaben säubern: Nur echte Objekte durchlassen
    const safe = Array.isArray(messages) ? messages.filter(m => m && typeof m === 'object') : [];

    // 2) (Optional) Für den Proxy zusätzlich eine flache Prompt-Zusammenfassung bauen:
    //    Wir concatenaten alle message.contents → das kann dein Backend loggen/verwenden,
    //    falls es die "messages" Struktur ignoriert.
    const userContent = safe.map(m => (typeof m.content === 'string' ? m.content : ''))
                            .filter(Boolean).join('\n\n');
    const promptString = userContent || 'Write an engaging interactive story.';

    // 3) Body für den Proxy: sowohl messages als auch promptString
    const body = { messages: safe, prompt: promptString, context: [] };

    // 4) Request an den lokalen Proxy
    const response = await fetch('http://localhost:3000/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Bei HTTP-Fehlern sofort neutral zurück
    if (!response.ok) return {};

    // 5) Inhalt robust lesen (JSON oder Text → JSON parsen)
    const ct = response.headers.get('content-type') || '';
    let data;
    if (ct.includes('application/json')) data = await response.json();
    else {
      const text = await response.text();
      try { data = JSON.parse(text); } catch { data = { text }; }
    }

    // 6) Happy Path: klassisches OpenAI-Format vorhanden?
    //    { choices: [ { message: { content: "..." } } ] }
    if (data?.choices?.[0]?.message?.content) return data;

    // 7) Fallbacks: Falls dein Proxy eine einfachere Struktur liefert,
    //    versuche, den Text in ein "choices[0].message.content" zu überführen.
    let content = null;
    if (typeof data?.content === 'string') content = data.content;
    else if (typeof data?.message === 'string') content = data.message;
    else if (typeof data?.story === 'string') content = data.story;
    else if (typeof data?.text === 'string') content = data.text;
    else if (typeof data === 'string') content = data;

    if (content) return { choices: [{ message: { content } }] };

    // 8) Nichts Brauchbares gefunden → leeres Objekt
    return {};
  } catch {
    // Netzwerk-/Parsing-Fehler → stiller Fallback
    return {};
  }
}

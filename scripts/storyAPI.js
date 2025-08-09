async function generateStoryFromContext(messages) {
  try {
    // Prepare messages array and prompt string
    const safeMessages = Array.isArray(messages) ? messages.filter(m => m && typeof m === "object") : [];
    const userContent = safeMessages
      .map(m => (typeof m.content === "string" ? m.content : ""))
      .filter(Boolean)
      .join("\n\n");

    const promptString = userContent || "Write an engaging interactive story.";

    // Send both messages and prompt/context to support either format
    const body = {
      messages: safeMessages,
      prompt: promptString,
      context: []
    };

    const response = await fetch("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error("Proxy API error:", response.status, response.statusText);
      return {};
    }

    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try { data = JSON.parse(text); } catch { data = { text }; }
    }

    if (data?.choices?.[0]?.message?.content) {
      return data;
    }

    let content = null;
    if (typeof data?.content === "string") content = data.content;
    else if (typeof data?.message === "string") content = data.message;
    else if (typeof data?.story === "string") content = data.story;
    else if (typeof data?.text === "string") content = data.text;
    else if (typeof data === "string") content = data;

    if (content) {
      return { choices: [{ message: { content } }] };
    }

    console.warn("Unexpected proxy payload:", data);
    return {};
  } catch (err) {
    console.error("Network/Parse error in /api/generate:", err);
    return {};
  }
}
window.generateStoryFromContext = generateStoryFromContext;

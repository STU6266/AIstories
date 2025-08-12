export function typeWriter(element, text, speed = 22) {
  element.innerHTML = '';
  let i = 0;
  (function typing() {
    if (i < text.length) {
      element.innerHTML += text[i] === '\n' ? '<br>' : text[i];
      i++;
      setTimeout(typing, speed);
    }
  })();
}

export function updateProgressBar(barEl, labelEl, pct) {
  const p = Math.max(0, Math.min(100, pct | 0));
  barEl.style.width = p + '%';
  barEl.setAttribute('aria-valuenow', String(p));
  labelEl.textContent = p + '%';
}

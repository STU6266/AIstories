let _interval = null;
let _listeners = [];
let _elapsed = 0;
let _total = 0;

export function onTick(fn) {
  if (typeof fn === 'function') _listeners.push(fn);
}

function emit() {
  _listeners.forEach(fn => fn(_elapsed, _total));
}

export function startTimer(minutes) {
  const m = Math.max(1, parseInt(minutes || 30, 10));
  _total = m * 60;
  _elapsed = 0;
  stopTimer();
  _interval = setInterval(() => {
    _elapsed += 1;
    if (_elapsed > _total) _elapsed = _total;
    emit();
    if (_elapsed >= _total) stopTimer();
  }, 1000);
  emit();
}

export function stopTimer() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}

export function setTimerDisplay(el, sec) {
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  el.textContent = `${mm}:${String(ss).padStart(2, '0')}`;
}
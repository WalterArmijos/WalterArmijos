/** Tiny DOM toolkit: element builder, icons, sheets, toasts, formatting. */

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in el && k !== 'list' && typeof v !== 'object') el[k] = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(3)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const frag = (...kids) => {
  const f = document.createDocumentFragment();
  kids.flat(3).filter(Boolean).forEach(k => f.append(k.nodeType ? k : document.createTextNode(String(k))));
  return f;
};

/* ------------------------------ icons ------------------------------ */
const P = {
  home:     '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  dumbbell: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  history:  '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3.5 2"/>',
  chart:    '<path d="M3 3v18h18"/><path d="m7 14 3.5-4 3.5 3 5-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  play:     '<path d="M6 4.5v15l13-7.5z"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  minus:    '<path d="M5 12h14"/>',
  check:    '<path d="m4 12.5 5.5 5.5L20 6.5"/>',
  x:        '<path d="M18 6 6 18M6 6l12 12"/>',
  chevron:  '<path d="m9 18 6-6-6-6"/>',
  back:     '<path d="m15 18-6-6 6-6"/>',
  trash:    '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>',
  edit:     '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  timer:    '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  flame:    '<path d="M12 22c4 0 7-2.7 7-6.5 0-4.6-4.5-6-4.5-10.5C12 6 11 7.5 11 9.5c0 1.2.5 2 .5 2S10 10 9 8.5C7.4 10 5 12.2 5 15.5 5 19.3 8 22 12 22z"/>',
  scale:    '<path d="M4 20h16"/><path d="M12 20V8"/><circle cx="12" cy="6" r="2.5"/><path d="M6 20a6 6 0 0 1 12 0"/>',
  note:     '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  copy:     '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5h10"/>',
  download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
  upload:   '<path d="M12 20V8"/><path d="m7 12 5-5 5 5"/><path d="M4 20h16"/>',
  info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
  grip:     '<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
  swap:     '<path d="M7 4 3 8l4 4"/><path d="M3 8h13a4 4 0 0 1 0 8h-1"/>',
  trophy:   '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3"/><path d="M10 13h4v3h-4zM8 20h8M12 16v4"/>',
  target:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  search:   '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  stretch:  '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M12 13l-3.5 6M12 13l3.5 6M6 9.5 12 8l6 1.5"/>',
};

export function icon(name, cls = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (name === 'play') { svg.setAttribute('fill', 'currentColor'); svg.setAttribute('stroke', 'none'); }
  svg.innerHTML = P[name] || '';
  if (cls) svg.setAttribute('class', cls);
  return svg;
}

/* ------------------------------ sheet ------------------------------ */
let openSheets = 0;

export function sheet(build, { onClose } = {}) {
  const backdrop = h('div', { class: 'sheet-backdrop', role: 'dialog', 'aria-modal': 'true' });
  const panel = h('div', { class: 'sheet' }, h('div', { class: 'sheet-grip' }));
  backdrop.append(panel);

  const close = () => {
    if (!backdrop.isConnected) return;
    backdrop.remove();
    if (--openSheets === 0) document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', onKey);

  panel.append(build(close));
  document.body.append(backdrop);
  openSheets++;
  document.body.style.overflow = 'hidden';
  panel.querySelector('input,select,textarea,button')?.focus?.({ preventScroll: true });
  return close;
}

export function confirmSheet({ title, message, confirmText = 'Confirm', danger = false, onConfirm }) {
  sheet(close => frag(
    h('h2', {}, title),
    message && h('p', { class: 'muted small', style: { marginTop: '6px' } }, message),
    h('div', { class: 'sheet-actions' },
      h('button', {
        class: `btn btn-lg btn-block ${danger ? 'btn-danger' : 'btn-primary'}`,
        onClick: () => { close(); onConfirm?.(); },
      }, confirmText),
      h('button', { class: 'btn btn-lg btn-block btn-ghost', onClick: close }, 'Cancel'),
    ),
  ));
}

/** Prompt for a single value. */
export function promptSheet({ title, label, value = '', type = 'text', placeholder = '', hint = '', onSave, saveText = 'Save' }) {
  sheet(close => {
    const input = h('input', { class: 'input', type, value, placeholder,
      inputmode: type === 'number' ? 'decimal' : undefined });
    const submit = () => { close(); onSave?.(input.value); };
    const form = h('form', { onSubmit: (e) => { e.preventDefault(); submit(); } },
      h('h2', {}, title),
      hint && h('p', { class: 'muted small', style: { margin: '6px 0 0' } }, hint),
      h('div', { class: 'field', style: { marginTop: '14px' } }, label && h('label', {}, label), input),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn btn-lg btn-block btn-primary', type: 'submit' }, saveText),
        h('button', { class: 'btn btn-lg btn-block btn-ghost', type: 'button', onClick: close }, 'Cancel'),
      ),
    );
    setTimeout(() => { input.focus(); input.select(); }, 60);
    return form;
  });
}

/* ------------------------------ toast ------------------------------ */
let toastWrap = null;
export function toast(msg, { kind = '', ms = 2200 } = {}) {
  if (!toastWrap) {
    toastWrap = h('div', { class: 'toast-wrap', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastWrap);
  }
  const t = h('div', { class: `toast ${kind}` }, msg);
  toastWrap.append(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 220); }, ms);
}

/* --------------------------- formatting --------------------------- */
export const pad = n => String(n).padStart(2, '0');

export function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const hrs = Math.floor(sec / 3600), min = Math.floor((sec % 3600) / 60);
  if (hrs) return `${hrs}h ${min}m`;
  if (min) return `${min}m`;
  return `${sec}s`;
}

export const fmtClock = (sec) => {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
};

export function fmtDate(ts, { withYear = false } = {}) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}

export function fmtDay(ts) {
  const d = new Date(ts), now = new Date();
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
                           new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7 && days > 0) return `${days} days ago`;
  return fmtDate(ts, { withYear: new Date(ts).getFullYear() !== now.getFullYear() });
}

export const fmtNum = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

export function fmtVolume(lb) {
  if (lb >= 10000) return `${(lb / 1000).toFixed(1)}k`;
  return fmtNum(lb);
}

/* ---------------------------- feedback ---------------------------- */
export function buzz(pattern = 18) {
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
}

let audioCtx = null;
export function beep(freq = 880, ms = 160, vol = 0.18) {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch { /* audio blocked */ }
}

/** Unlock audio on the first user gesture so the rest timer can chime later. */
export function primeAudio() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume?.();
  } catch { /* ignore */ }
}

export const empty = (iconName, title, sub) =>
  h('div', { class: 'empty' }, icon(iconName), h('p', { style: { fontWeight: '650', color: 'var(--text-2)' } }, title),
    sub && h('p', { class: 'small', style: { marginTop: '4px' } }, sub));

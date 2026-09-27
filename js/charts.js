/**
 * Dependency-free SVG charts. Single-series by design — one measure, one axis,
 * a recessive grid, selective labels, a hover/crosshair layer, and a table view
 * behind a toggle so the data is never color-only.
 */
import { h, fmtDate } from './ui.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(k, v);
  return el;
};

function niceTicks(min, max, count = 4) {
  if (min === max) { const p = Math.abs(min || 1) * 0.1; min -= p; max += p; }
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = ([1, 2, 2.5, 5, 10].find(m => m * mag >= raw) ?? 10) * mag;
  const out = [];
  for (let t = Math.ceil(min / step) * step; t <= max + step * 0.001; t += step) out.push(+t.toFixed(6));
  return out;
}

/** Drop ticks whose printed label repeats — small integer ranges hit this a lot. */
function labelledTicks(min, max, count, format) {
  const seen = new Set();
  return niceTicks(min, max, count).filter(t => {
    const key = format(t);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function tableView(rows, headers) {
  return h('details', { class: 'table-toggle' },
    h('summary', {}, 'View as table'),
    h('table', { class: 'data-table' },
      h('thead', {}, h('tr', {}, ...headers.map(x => h('th', {}, x)))),
      h('tbody', {}, ...rows.map(r => h('tr', {}, ...r.map(c => h('td', { class: 'tnum' }, c))))),
    ),
  );
}

/**
 * Line chart with a crosshair tooltip.
 * points: [{ x:number(ts), y:number, label?:string }]
 */
export function lineChart(points, {
  height = 168, format = v => String(Math.round(v)), color = 'var(--series-1)',
  goal = null, goalLabel = 'Goal', area = true, tableHeaders = ['Date', 'Value'],
} = {}) {
  if (!points || points.length < 2) return null;

  const W = 340, H = height;
  const m = { t: 14, r: 12, b: 24, l: 40 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;

  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  let lo = Math.min(...ys, goal ?? Infinity), hi = Math.max(...ys, goal ?? -Infinity);
  const padY = (hi - lo || Math.abs(hi) * 0.08 || 1) * 0.16;
  lo -= padY; hi += padY;
  const x0 = Math.min(...xs), x1 = Math.max(...xs);

  const X = v => m.l + (x1 === x0 ? iw / 2 : ((v - x0) / (x1 - x0)) * iw);
  const Y = v => m.t + ih - ((v - lo) / (hi - lo)) * ih;

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Line chart' });

  // grid + y labels
  for (const t of labelledTicks(lo, hi, 3, format)) {
    svg.append(s('line', { x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t), stroke: 'var(--grid)', 'stroke-width': 1 }));
    const lbl = s('text', { x: m.l - 7, y: Y(t) + 4, 'text-anchor': 'end',
      'font-size': 10.5, fill: 'var(--text-3)', 'font-weight': 600 });
    lbl.textContent = format(t);
    svg.append(lbl);
  }

  if (goal !== null) {
    svg.append(s('line', { x1: m.l, x2: W - m.r, y1: Y(goal), y2: Y(goal),
      stroke: 'var(--good)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4', opacity: .85 }));
    const gl = s('text', { x: W - m.r, y: Y(goal) - 5, 'text-anchor': 'end',
      'font-size': 10, fill: 'var(--good)', 'font-weight': 700 });
    gl.textContent = `${goalLabel} ${format(goal)}`;
    svg.append(gl);
  }

  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  if (area) {
    const grad = s('linearGradient', { id: `g${Math.random().toString(36).slice(2, 8)}`, x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(s('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': .22 }));
    grad.append(s('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }));
    const defs = s('defs'); defs.append(grad); svg.append(defs);
    svg.append(s('path', { d: `${d} L${X(x1)},${m.t + ih} L${X(x0)},${m.t + ih} Z`, fill: `url(#${grad.id})` }));
  }
  svg.append(s('path', { d, fill: 'none', stroke: color, 'stroke-width': 2,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));

  // end marker + its value, direct-labelled
  const last = points.at(-1);
  svg.append(s('circle', { cx: X(last.x), cy: Y(last.y), r: 4.5, fill: color,
    stroke: 'var(--surface-1)', 'stroke-width': 2 }));

  // x labels: first and last only, so they never collide
  for (const [p, anchor] of [[points[0], 'start'], [last, 'end']]) {
    const tx = s('text', { x: X(p.x), y: H - 6, 'text-anchor': anchor,
      'font-size': 10.5, fill: 'var(--text-3)', 'font-weight': 600 });
    tx.textContent = p.label ?? fmtDate(p.x);
    svg.append(tx);
  }

  // hover layer
  const cross = s('line', { y1: m.t, y2: m.t + ih, stroke: 'var(--border-strong)', 'stroke-width': 1, opacity: 0 });
  const dot = s('circle', { r: 5, fill: color, stroke: 'var(--surface-1)', 'stroke-width': 2, opacity: 0 });
  svg.append(cross, dot);

  const wrap = h('div', { class: 'chart-wrap' });
  const tip = h('div', { class: 'chart-tip' });
  wrap.append(svg, tip);

  const move = (evt) => {
    const r = svg.getBoundingClientRect();
    const cx = ((evt.touches?.[0]?.clientX ?? evt.clientX) - r.left) / r.width * W;
    let best = points[0], bd = Infinity;
    for (const p of points) { const dd = Math.abs(X(p.x) - cx); if (dd < bd) { bd = dd; best = p; } }
    cross.setAttribute('x1', X(best.x)); cross.setAttribute('x2', X(best.x)); cross.setAttribute('opacity', 1);
    dot.setAttribute('cx', X(best.x)); dot.setAttribute('cy', Y(best.y)); dot.setAttribute('opacity', 1);
    tip.innerHTML = `<div class="tv tnum">${format(best.y)}</div><div style="opacity:.75">${best.label ?? fmtDate(best.x)}</div>`;
    tip.classList.add('on');
    tip.style.left = `${(X(best.x) / W) * 100}%`;
    tip.style.top = `${(Y(best.y) / H) * r.height - 10}px`;
  };
  const leave = () => { cross.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); tip.classList.remove('on'); };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', leave);
  svg.addEventListener('pointercancel', leave);

  wrap.append(tableView(
    points.slice().reverse().map(p => [p.label ?? fmtDate(p.x), format(p.y)]),
    tableHeaders,
  ));
  return wrap;
}

/**
 * Vertical bar chart. bars: [{ label, value, sub? }]
 */
export function barChart(bars, {
  height = 150, format = v => String(Math.round(v)), color = 'var(--series-1)',
  tableHeaders = ['Period', 'Value'],
} = {}) {
  if (!bars?.length) return null;

  const W = 340, H = height;
  const m = { t: 16, r: 6, b: 22, l: 38 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const hi = Math.max(...bars.map(b => b.value), 1);
  const gap = 2;                                    // 2px surface gap between fills
  const bw = Math.max(6, iw / bars.length - gap);
  const Y = v => m.t + ih - (v / hi) * ih;

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Bar chart' });

  for (const t of labelledTicks(0, hi, 2, format)) {
    if (t > hi) continue;
    svg.append(s('line', { x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t), stroke: 'var(--grid)', 'stroke-width': 1 }));
    const lbl = s('text', { x: m.l - 7, y: Y(t) + 4, 'text-anchor': 'end',
      'font-size': 10.5, fill: 'var(--text-3)', 'font-weight': 600 });
    lbl.textContent = format(t);
    svg.append(lbl);
  }

  const wrap = h('div', { class: 'chart-wrap' });
  const tip = h('div', { class: 'chart-tip' });

  bars.forEach((b, i) => {
    const x = m.l + i * (bw + gap);
    const y = b.value > 0 ? Y(b.value) : m.t + ih;
    const bh = Math.max(b.value > 0 ? 3 : 0, m.t + ih - y);
    const rect = s('rect', { x, y, width: bw, height: bh, rx: Math.min(4, bw / 2),
      fill: b.value > 0 ? color : 'var(--surface-3)', style: 'cursor:pointer' });
    if (b.value === 0) { rect.setAttribute('y', m.t + ih - 3); rect.setAttribute('height', 3); }
    svg.append(rect);

    const lbl = s('text', { x: x + bw / 2, y: H - 6, 'text-anchor': 'middle',
      'font-size': 10, fill: 'var(--text-3)', 'font-weight': 600 });
    lbl.textContent = b.label;
    svg.append(lbl);

    const show = () => {
      tip.innerHTML = `<div class="tv tnum">${format(b.value)}</div><div style="opacity:.75">${b.sub ?? b.label}</div>`;
      tip.classList.add('on');
      tip.style.left = `${((x + bw / 2) / W) * 100}%`;
      tip.style.top = `${(y / H) * svg.getBoundingClientRect().height - 8}px`;
    };
    rect.addEventListener('pointerenter', show);
    rect.addEventListener('pointerdown', show);
  });

  svg.addEventListener('pointerleave', () => tip.classList.remove('on'));
  wrap.append(svg, tip, tableView(bars.map(b => [b.sub ?? b.label, format(b.value)]), tableHeaders));
  return wrap;
}

/** Horizontal ranked bars — for "where your volume actually went". */
export function rankBars(items, { format = v => String(Math.round(v)) } = {}) {
  if (!items?.length) return null;
  const hi = Math.max(...items.map(i => i.value), 1);
  return h('div', { class: 'stack', style: { gap: '9px' } },
    ...items.map(it => h('div', {},
      h('div', { class: 'spread', style: { marginBottom: '4px' } },
        h('span', { class: 'small', style: { fontWeight: '640' } }, it.label),
        h('span', { class: 'small dim tnum' }, format(it.value)),
      ),
      h('div', { style: { height: '8px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden' } },
        h('i', { style: {
          display: 'block', height: '100%', width: `${Math.max(3, (it.value / hi) * 100)}%`,
          background: 'var(--series-1)', borderRadius: '999px',
        } }),
      ),
    )),
  );
}

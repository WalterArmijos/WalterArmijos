/** Workout history list + a single completed workout. */
import { h, icon, frag, confirmSheet, promptSheet, toast, empty, fmtDuration, fmtVolume, fmtDate, fmtDay } from '../ui.js';
import * as S from '../store.js';
import { go } from '../router.js';
import { sessionRow } from './home.js';
import { treadmillKcal } from '../store.js';

export function historyView() {
  const view = h('div', { class: 'view' });
  const sessions = S.state.sessions;

  if (!sessions.length) {
    view.append(empty('history', 'No workouts logged yet',
      'Once you finish your first session it shows up here with every set you did.'));
    return view;
  }

  const totalVol = sessions.reduce((v, s) => v + (s.volume || 0), 0);
  const totalMin = Math.round(sessions.reduce((m, s) => m + s.durationSec, 0) / 60);
  const totalCal = sessions.reduce((c, s) => c + (s.calories || 0), 0);

  view.append(h('div', { class: 'stat-row', style: { marginTop: '4px' } },
    st('Workouts', String(sessions.length), ''),
    st('Time', totalMin >= 60 ? (totalMin / 60).toFixed(1) : String(totalMin), totalMin >= 60 ? 'hrs' : 'min'),
    st('Burned', fmtVolume(totalCal), 'kcal'),
  ));

  let editing = false;
  const listWrap = h('div');

  const paintList = () => {
    listWrap.replaceChildren();
    for (const g of groupByMonth()) {
      listWrap.append(
        h('div', { class: 'section-title' }, g.label),
        h('div', { class: 'stack' }, ...g.rows.map(row => sessionRow(row, {
          onDelete: editing ? (target) => confirmSheet({
            title: `Delete "${target.name}"?`,
            message: `${fmtDay(target.startedAt)} · ${target.setCount} set${target.setCount === 1 ? '' : 's'}. This removes it from your history and stats for good.`,
            confirmText: 'Delete workout', danger: true,
            onConfirm: async () => { await S.deleteSession(target.id); toast('Deleted'); go('/history'); },
          }) : null,
        }))),
      );
    }
  };

  view.append(h('div', { class: 'spread', style: { marginTop: '18px' } },
    h('span', { class: 'section-title', style: { margin: '0 2px' } }, 'All workouts'),
    h('button', { class: 'btn btn-sm btn-ghost', onClick: (e) => {
      editing = !editing;
      e.currentTarget.textContent = editing ? 'Done' : 'Edit';
      paintList();
    } }, 'Edit'),
  ));
  paintList();
  view.append(listWrap);
  return view;
}

function groupByMonth() {
  const sessions = S.state.sessions;
  const groups = new Map();
  sessions.forEach(s => {
    const d = new Date(s.startedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups.has(key)) groups.set(key, { label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), rows: [] });
    groups.get(key).rows.push(s);
  });
  return [...groups.values()];
}

const st = (k, v, u) => h('div', { class: 'stat' },
  h('div', { class: 'k' }, k),
  h('div', { class: 'v tnum' }, v, u && h('span', { class: 'u' }, u)));

/* ------------------------------------------------------------------ */
export function workoutDetailView(id, params) {
  const s = S.state.sessions.find(x => x.id === id);
  const view = h('div', { class: 'view' });
  if (!s) { view.append(empty('info', 'Workout not found')); return view; }

  const prs = s.entries.flatMap(e => e.sets.filter(x => x.isPR).map(() => e.name));

  if (params?.celebrate) {
    view.append(h('div', { class: 'hero', style: { marginTop: '4px' } },
      h('div', { class: 'label' }, 'Logged'),
      h('h2', {}, 'Workout complete'),
      h('div', { class: 'meta' },
        `${s.setCount} sets · ${fmtDuration(s.durationSec)}` + (s.calories ? ` · ~${s.calories} kcal` : '')),
      prs.length > 0 && h('div', { class: 'meta', style: { marginTop: '6px', fontWeight: '700' } },
        `${prs.length} personal best${prs.length === 1 ? '' : 's'} today`),
      h('button', { class: 'btn btn-block', onClick: () => go('/') }, 'Back to home'),
    ));
  }

  view.append(
    h('div', { class: 'card', style: { marginTop: params?.celebrate ? '12px' : '4px' } },
      h('h1', {}, s.name),
      h('p', { class: 'muted small', style: { marginTop: '3px' } },
        `${fmtDay(s.startedAt)} · ${new Date(s.startedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`),
      h('div', { class: 'stat-row', style: { marginTop: '13px' } },
        st('Duration', fmtDuration(s.durationSec).replace(/[a-z ]+$/i, ''), fmtDuration(s.durationSec).match(/[a-z]+$/i)?.[0] || ''),
        st('Sets', String(s.setCount), ''),
        s.volume > 0 ? st('Volume', fmtVolume(s.volume), 'lb') : st('Burned', fmtVolume(s.calories || 0), 'kcal'),
      ),
      s.notes && h('div', { class: 'cue', style: { margin: '13px 0 0' } }, s.notes),
    ),
  );

  view.append(h('div', { class: 'section-title' }, 'What you did'));
  s.entries.forEach(e => {
    const card = h('div', { class: 'ex-card', style: { marginBottom: '12px' } });
    card.append(h('div', { class: 'ex-head' },
      h('div', { class: 'n' },
        h('div', { class: 'name' }, e.name),
        h('div', { class: 'sub' }, entrySummary(e)),
      ),
      e.sets.some(x => x.isPR) && h('span', { class: 'chip chip-pr' }, icon('trophy'), 'PR'),
    ));

    const grid = h('div', { class: 'set-grid', style: { paddingTop: '2px' } });
    e.sets.forEach((x, i) => grid.append(
      h('div', { class: 'row', style: {
        padding: '7px 2px', borderBottom: i < e.sets.length - 1 ? '1px solid var(--border)' : 'none',
      } },
        h('span', { class: 'dim tnum', style: { width: '20px', fontSize: '13px', fontWeight: '700' } }, String(i + 1)),
        h('span', { style: { fontWeight: '640', fontSize: '14.5px' } }, setText(e, x)),
        x.isPR && h('span', { class: 'chip chip-pr', style: { marginLeft: 'auto' } }, 'best'),
      ),
    ));
    card.append(grid);
    if (e.userNote) card.append(h('div', { class: 'cue' }, e.userNote));
    view.append(card);
  });

  view.append(h('div', { class: 'stack', style: { marginTop: '16px' } },
    h('button', { class: 'btn btn-outline btn-block', onClick: () => promptSheet({
      title: 'Rename workout', label: 'Name', value: s.name,
      hint: 'Only changes this logged session, not the template it came from.',
      onSave: async (name) => {
        if (!name.trim()) return toast('Give it a name');
        await S.renameSession(s.id, name);
        toast('Renamed');
        go(`/workout/${s.id}`);
      },
    }) }, icon('edit'), 'Rename'),
    h('button', { class: 'btn btn-danger btn-block', onClick: () => confirmSheet({
      title: 'Delete this workout?', message: 'It will be removed from your history and stats. This cannot be undone.',
      confirmText: 'Delete', danger: true,
      onConfirm: async () => { await S.deleteSession(s.id); toast('Deleted'); go('/history'); },
    }) }, icon('trash'), 'Delete workout'),
  ));

  return view;
}

function entrySummary(e) {
  if (e.type === 'cardio') {
    const min = e.sets.reduce((m, x) => m + (Number(x.min) || 0), 0);
    const kcal = e.sets.reduce((c, x) => c + treadmillKcal(x), 0);
    return `${min} min · ~${kcal} kcal`;
  }
  const n = e.sets.length;
  const sets = `${n} set${n === 1 ? '' : 's'}`;
  if (e.type === 'time') {
    const total = e.sets.reduce((t, x) => t + (Number(x.timeSec) || 0), 0);
    return `${sets} · ${total}s total`;
  }
  const reps = e.sets.reduce((r, x) => r + (Number(x.reps) || 0), 0);
  const vol = S.entryVolume(e);
  return `${sets} · ${reps} reps` + (e.type === 'weight_reps' && vol ? ` · ${fmtVolume(vol)} lb` : '');
}

function setText(e, x) {
  if (e.type === 'cardio') return `${x.min || 0} min @ ${x.incline || 0}% · ${x.speed || 0} mph · ~${treadmillKcal(x)} kcal`;
  if (e.type === 'time')   return `${x.timeSec || 0} sec${e.perSide ? ' per side' : ''}`;
  if (e.type === 'reps')   return `${x.reps || 0} reps${x.weight ? ` + ${x.weight} lb` : ''}`;
  return `${x.weight || 0} lb × ${x.reps || 0}`;
}

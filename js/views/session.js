/** The live workout screen: log sets, rest, tweak on the fly. */
import {
  h, icon, frag, sheet, confirmSheet, promptSheet, toast, empty,
  fmtClock, fmtDuration, fmtVolume, beep, buzz, primeAudio,
} from '../ui.js';
import * as S from '../store.js';
import { go } from '../router.js';
import { exercisePicker } from './picker.js';

let tick = null;        // 1s interval while the screen is mounted
let wakeLock = null;

/* ------------------------------------------------------------------ */
/* Screen wake lock — nobody wants the screen dying mid-set            */
/* ------------------------------------------------------------------ */
async function requestWake() {
  if (!S.state.settings.keepScreenOn) return;
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* unsupported */ }
}
function releaseWake() { try { wakeLock?.release(); } catch {} wakeLock = null; }
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S.state.active && location.hash === '#/session') requestWake();
});

export function sessionView() {
  const a = S.state.active;
  if (!a) {
    return h('div', { class: 'view' },
      empty('dumbbell', 'No workout in progress', 'Start one from the Workouts tab.'),
      h('button', { class: 'btn btn-primary btn-block', onClick: () => go('/templates') }, 'Choose a workout'));
  }

  primeAudio();
  requestWake();

  const view = h('div', { class: 'view', id: 'sessionView' });
  render(view);
  startTicker(view);
  return view;
}

export function teardownSession() {
  clearInterval(tick); tick = null;
  releaseWake();
}

function startTicker(view) {
  clearInterval(tick);
  tick = setInterval(() => {
    const a = S.state.active;
    if (!a || !view.isConnected) { clearInterval(tick); tick = null; return; }

    const el = view.querySelector('#elapsed');
    if (el) el.textContent = fmtDuration((Date.now() - a.startedAt) / 1000);

    const bar = document.querySelector('.rest-bar');
    if (a.restEndsAt) {
      const left = (a.restEndsAt - Date.now()) / 1000;
      if (left <= 0) {
        finishRest();
      } else if (bar) {
        bar.querySelector('.rest-time').textContent = fmtClock(left);
        bar.querySelector('.rest-prog > i').style.width = `${(left / a.restTotal) * 100}%`;
      }
    }
  }, 1000);
}

/* ------------------------------------------------------------------ */
/* Rest timer                                                          */
/* ------------------------------------------------------------------ */
function startRest(seconds) {
  const a = S.state.active;
  if (!a || !seconds) return;
  a.restEndsAt = Date.now() + seconds * 1000;
  a.restTotal = seconds;
  S.persistActive();
  renderRestBar();
}

function adjustRest(delta) {
  const a = S.state.active;
  if (!a?.restEndsAt) return;
  a.restEndsAt = Math.max(Date.now() + 1000, a.restEndsAt + delta * 1000);
  a.restTotal = Math.max(a.restTotal + delta, 5);
  S.persistActive();
  renderRestBar();
}

function stopRest() {
  const a = S.state.active;
  if (!a) return;
  a.restEndsAt = null;
  S.persistActive();
  document.querySelector('.rest-bar')?.remove();
}

function finishRest() {
  const a = S.state.active;
  if (!a?.restEndsAt) return;
  a.restEndsAt = null;
  S.persistActive();
  if (S.state.settings.sound) { beep(880, 140); setTimeout(() => beep(1180, 200), 170); }
  if (S.state.settings.vibrate) buzz([90, 70, 140]);
  const bar = document.querySelector('.rest-bar');
  if (bar) {
    bar.querySelector('.rest-time').textContent = 'Go';
    bar.querySelector('.rest-time').classList.add('ready');
    bar.querySelector('.rest-prog > i').style.width = '100%';
    setTimeout(() => bar.remove(), 2600);
  }
}

function renderRestBar() {
  const a = S.state.active;
  document.querySelector('.rest-bar')?.remove();
  if (!a?.restEndsAt) return;
  const left = (a.restEndsAt - Date.now()) / 1000;

  const bar = h('div', { class: 'rest-bar' },
    h('div', { class: 'rest-inner' },
      h('div', { class: 'rest-time tnum' }, fmtClock(left)),
      h('div', { class: 'rest-prog' }, h('i', { style: { width: `${(left / a.restTotal) * 100}%` } })),
      h('button', { class: 'icon-btn', 'aria-label': 'Subtract 15 seconds', onClick: () => adjustRest(-15) }, icon('minus')),
      h('button', { class: 'icon-btn', 'aria-label': 'Add 15 seconds', onClick: () => adjustRest(15) }, icon('plus')),
      h('button', { class: 'icon-btn plain', 'aria-label': 'Skip rest', onClick: stopRest }, icon('x')),
    ),
  );
  document.body.append(bar);
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
function rerender(view) {
  const scroll = window.scrollY;
  view.replaceChildren();
  render(view);
  window.scrollTo(0, scroll);
}

function render(view) {
  const a = S.state.active;
  const doneSets = a.entries.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  const allSets = a.entries.reduce((n, e) => n + e.sets.length, 0);
  const vol = a.entries.reduce((v, e) => v + S.entryVolume({ ...e, sets: e.sets.filter(s => s.done) }), 0);

  view.append(
    h('div', { class: 'card', style: { marginTop: '4px' } },
      h('div', { class: 'spread' },
        h('div', {},
          h('div', { class: 'xsmall dim', style: { fontWeight: '700', letterSpacing: '.05em', textTransform: 'uppercase' } }, 'Elapsed'),
          h('div', { id: 'elapsed', class: 'tnum', style: { fontSize: '25px', fontWeight: '750', letterSpacing: '-.02em' } },
            fmtDuration((Date.now() - a.startedAt) / 1000)),
        ),
        h('div', { style: { textAlign: 'right' } },
          h('div', { class: 'xsmall dim', style: { fontWeight: '700', letterSpacing: '.05em', textTransform: 'uppercase' } }, 'Sets'),
          h('div', { class: 'tnum', style: { fontSize: '25px', fontWeight: '750', letterSpacing: '-.02em' } },
            `${doneSets}/${allSets}`),
        ),
        vol > 0 && h('div', { style: { textAlign: 'right' } },
          h('div', { class: 'xsmall dim', style: { fontWeight: '700', letterSpacing: '.05em', textTransform: 'uppercase' } }, 'Volume'),
          h('div', { class: 'tnum', style: { fontSize: '25px', fontWeight: '750', letterSpacing: '-.02em' } }, fmtVolume(vol)),
        ),
      ),
      h('div', { style: { height: '6px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden', marginTop: '12px' } },
        h('i', { style: { display: 'block', height: '100%', borderRadius: '999px', background: 'var(--accent)',
          width: `${allSets ? (doneSets / allSets) * 100 : 0}%`, transition: 'width .3s ease' } })),
    ),
  );

  if (!a.entries.length) {
    view.append(h('div', { class: 'card', style: { marginTop: '12px' } },
      empty('dumbbell', 'Empty workout', 'Add your first exercise below.')));
  }

  a.entries.forEach((entry, ei) => view.append(exerciseCard(entry, ei, view)));

  view.append(
    h('button', { class: 'btn btn-outline btn-block', style: { marginTop: '12px' },
      onClick: () => addExercise(view) }, icon('plus'), 'Add exercise'),
    h('div', { class: 'field', style: { marginTop: '16px' } },
      h('label', {}, 'Workout notes'),
      h('textarea', {
        class: 'input', rows: 2, placeholder: 'How did it feel? Anything to remember for next time?',
        value: a.notes,
        onInput: (e) => { a.notes = e.target.value; },
        onBlur: () => S.persistActive(),
      }),
    ),
    h('div', { class: 'stack', style: { marginTop: '16px' } },
      h('button', { class: 'btn btn-primary btn-lg btn-block', onClick: () => finish(view) },
        icon('check'), 'Finish workout'),
      h('button', { class: 'btn btn-block btn-ghost', onClick: () => confirmSheet({
        title: 'Discard this workout?',
        message: 'Everything you logged in this session will be thrown away. This cannot be undone.',
        confirmText: 'Discard workout', danger: true,
        onConfirm: async () => { stopRest(); await S.discardActive(); toast('Workout discarded'); go('/'); },
      }) }, 'Discard workout'),
    ),
  );

  if (a.restEndsAt) renderRestBar();
}

/* ------------------------------------------------------------------ */
/* Exercise card                                                       */
/* ------------------------------------------------------------------ */
function exerciseCard(entry, ei, view) {
  const ex = S.exerciseById(entry.exerciseId);
  const allDone = entry.sets.length > 0 && entry.sets.every(s => s.done);
  const prev = S.lastPerformance(entry.exerciseId, S.state.active.startedAt);

  const card = h('div', { class: `ex-card ${allDone ? 'complete' : ''}` });

  card.append(
    h('div', { class: 'ex-head' },
      h('div', { class: 'n' },
        h('div', { class: 'name' }, entry.name),
        h('div', { class: 'sub' }, [
          entry.targetReps ? `Target ${entry.targetReps} reps` : null,
          entry.perSide ? 'per side' : null,
          entry.rest ? `${entry.rest}s rest` : null,
          prev ? `last: ${prevSummary(entry.type, prev.sets)}` : 'first time',
        ].filter(Boolean).join(' · ')),
      ),
      allDone && h('span', { class: 'chip chip-good' }, icon('check'), 'Done'),
      h('button', { class: 'icon-btn plain', 'aria-label': `Options for ${entry.name}`,
        onClick: () => exerciseMenu(entry, ei, view) }, icon('grip')),
    ),
  );

  if (entry.note) card.append(h('div', { class: 'cue' }, entry.note));

  const grid = h('div', { class: 'set-grid' });
  grid.append(setHeader(entry.type, entry.perSide));
  entry.sets.forEach((st, si) => grid.append(setRow(entry, st, si, view)));
  card.append(grid);

  card.append(
    h('div', { class: 'ex-foot' },
      h('button', { class: 'btn btn-sm', onClick: () => {
        const lastSet = entry.sets.at(-1);
        entry.sets.push(lastSet ? { ...lastSet, done: false, isPR: false } : { done: false });
        S.persistActive(); rerender(view);
      } }, icon('plus'), 'Set'),
      entry.sets.length > 1 && h('button', { class: 'btn btn-sm', onClick: () => {
        entry.sets.pop(); S.persistActive(); rerender(view);
      } }, icon('minus'), 'Set'),
      ex?.cue && h('button', { class: 'btn btn-sm btn-ghost', style: { marginLeft: 'auto' },
        onClick: () => sheet(close => frag(
          h('h2', {}, entry.name),
          h('p', { class: 'muted small', style: { marginTop: '10px', lineHeight: '1.55' } }, ex.cue),
          h('div', { class: 'sheet-actions' },
            h('button', { class: 'btn btn-lg btn-block btn-primary', onClick: close }, 'Got it')),
        )) }, icon('info'), 'How to'),
    ),
  );

  if (entry.userNote) {
    card.append(h('div', { class: 'ex-note' },
      h('input', { class: 'input', value: entry.userNote, placeholder: 'Note',
        onInput: e => { entry.userNote = e.target.value; },
        onBlur: () => S.persistActive() })));
  }

  return card;
}

const GRIDS = {
  weight_reps: '26px minmax(52px,1fr) 1fr 1fr 42px',
  reps:        '26px minmax(52px,1fr) .8fr 1fr 42px',
  time:        '26px minmax(52px,1fr) 1fr 42px 42px',
  cardio:      '26px 1fr 1fr 1fr 42px',
};

function setHeader(type, perSide) {
  const cols = {
    weight_reps: ['', 'Previous', 'lb', perSide ? 'Reps/side' : 'Reps', ''],
    reps:        ['', 'Previous', '+lb', perSide ? 'Reps/side' : 'Reps', ''],
    time:        ['', 'Previous', perSide ? 'Sec/side' : 'Seconds', '', ''],
    cardio:      ['', 'Minutes', 'Incline %', 'Speed mph', ''],
  }[type];
  return h('div', { class: 'set-hd', style: { gridTemplateColumns: GRIDS[type] } },
    ...cols.map(c => h('div', { style: { textAlign: c === 'Previous' ? 'center' : 'center' } }, c)));
}

function prevSummary(type, sets) {
  const best = sets[0];
  if (!best) return '—';
  if (type === 'weight_reps') return `${best.weight || 0} lb × ${best.reps || 0}`;
  if (type === 'reps')        return `${best.reps || 0} reps`;
  if (type === 'time')        return `${best.timeSec || 0}s`;
  if (type === 'cardio')      return `${best.min || 0} min @ ${best.incline || 0}%`;
  return '—';
}

function numInput(cls, value, placeholder, onCommit, { step = 'any', max } = {}) {
  return h('input', {
    class: `set-input ${cls}`, type: 'number', inputmode: 'decimal', step, max,
    value: value ?? '', placeholder,
    onFocus: e => e.target.select(),
    onInput: e => onCommit(e.target.value === '' ? null : Number(e.target.value)),
    onBlur: () => S.persistActive(),
  });
}

function setRow(entry, st, si, view) {
  const prev = S.lastPerformance(entry.exerciseId, S.state.active.startedAt);
  const prevSet = prev?.sets[si] ?? prev?.sets.at(-1);
  const row = h('div', {
    class: `set-row ${st.done ? 'done' : ''} ${st.isPR ? 'pr' : ''}`,
    style: { gridTemplateColumns: GRIDS[entry.type] },
  });

  row.append(h('div', { class: 'idx tnum' }, String(si + 1)));

  if (entry.type === 'cardio') {
    row.append(
      numInput('', st.min, 'min', v => { st.min = v; }),
      numInput('', st.incline, '%', v => { st.incline = v; }, { max: 40 }),
      numInput('', st.speed, 'mph', v => { st.speed = v; }, { step: 0.1 }),
    );
  } else {
    row.append(h('div', { class: 'prev tnum' },
      prevSet ? prevText(entry.type, prevSet) : '—'));

    if (entry.type === 'weight_reps') {
      row.append(
        numInput('weight', st.weight, prevSet?.weight ? String(prevSet.weight) : 'lb', v => { st.weight = v; }, { step: 2.5 }),
        numInput('reps', st.reps, prevSet?.reps ? String(prevSet.reps) : '—', v => { st.reps = v; }),
      );
    } else if (entry.type === 'reps') {
      row.append(
        numInput('weight', st.weight, '0', v => { st.weight = v; }, { step: 2.5 }),
        numInput('reps', st.reps, prevSet?.reps ? String(prevSet.reps) : '—', v => { st.reps = v; }),
      );
    } else { // time
      row.append(
        numInput('', st.timeSec, 'sec', v => { st.timeSec = v; }),
        h('button', {
          class: 'set-check', 'aria-label': 'Run a countdown for this hold',
          onClick: () => runHold(entry, st, si, view),
        }, icon('timer')),
      );
    }
  }

  row.append(h('button', {
    class: 'set-check', 'aria-label': st.done ? `Set ${si + 1} done` : `Mark set ${si + 1} done`,
    'aria-pressed': String(!!st.done),
    onClick: () => toggleSet(entry, st, si, view),
  }, icon('check')));

  return row;
}

function prevText(type, ps) {
  if (type === 'weight_reps') return `${ps.weight ?? 0}×${ps.reps ?? 0}`;
  if (type === 'reps')        return `${ps.reps ?? 0} reps`;
  if (type === 'time')        return `${ps.timeSec ?? 0}s`;
  return '—';
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */
function toggleSet(entry, st, si, view) {
  st.done = !st.done;

  if (st.done) {
    // fill in sensible values if the user just tapped the check
    if (entry.type === 'time' && !st.timeSec) st.timeSec = 30;
    if (entry.type === 'weight_reps' && st.reps == null) {
      const prev = S.lastPerformance(entry.exerciseId, S.state.active.startedAt)?.sets[si];
      st.reps = prev?.reps ?? parseInt(entry.targetReps, 10) ?? null;
      if (st.weight == null) st.weight = prev?.weight ?? null;
    }
    if (entry.type === 'reps' && st.reps == null) {
      st.reps = S.lastPerformance(entry.exerciseId, S.state.active.startedAt)?.sets[si]?.reps ?? null;
    }

    // personal record?
    const best = S.bestSet(entry.exerciseId, S.state.active.id);
    const score = S.setScore(entry.type, st);
    if (score > 0 && best && score > best.score * 1.001) {
      st.isPR = true;
      toast(`New best on ${entry.name}`, { kind: 'pr', ms: 2600 });
      if (S.state.settings.vibrate) buzz([30, 50, 30]);
    } else {
      st.isPR = false;
    }

    if (S.state.settings.vibrate) buzz(16);
    if (S.state.settings.restAuto && entry.rest > 0) startRest(entry.rest);
  } else {
    st.isPR = false;
  }

  S.persistActive();
  rerender(view);
}

/** Countdown for planks and other timed holds; auto-checks the set. */
function runHold(entry, st, si, view) {
  const total = Number(st.timeSec) || 30;
  primeAudio();
  let left = total;

  sheet(close => {
    const big = h('div', { class: 'tnum', style: {
      fontSize: '68px', fontWeight: '780', letterSpacing: '-.03em', textAlign: 'center', margin: '12px 0 4px',
    } }, String(left));
    const label = h('p', { class: 'muted small', style: { textAlign: 'center' } },
      entry.perSide ? `${entry.name} · switch sides after` : entry.name);

    const iv = setInterval(() => {
      left--;
      big.textContent = String(Math.max(0, left));
      if (left === 3 || left === 2 || left === 1) { if (S.state.settings.sound) beep(700, 90, .12); }
      if (left <= 0) {
        clearInterval(iv);
        if (S.state.settings.sound) { beep(980, 200); setTimeout(() => beep(1300, 260), 220); }
        if (S.state.settings.vibrate) buzz([100, 60, 160]);
        st.done = true; st.timeSec = total;
        S.persistActive();
        close();
        if (S.state.settings.restAuto && entry.rest > 0) startRest(entry.rest);
        rerender(view);
      }
    }, 1000);

    return frag(
      h('h2', { style: { textAlign: 'center' } }, 'Hold'),
      big, label,
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn btn-lg btn-block btn-ghost',
          onClick: () => { clearInterval(iv); close(); } }, 'Stop'),
      ),
    );
  });
}

function exerciseMenu(entry, ei, view) {
  const a = S.state.active;
  sheet(close => frag(
    h('h2', {}, entry.name),
    h('div', { style: { marginTop: '10px' } },
      listItem('note', 'Add a note', 'Something to remember next time', () => {
        close();
        promptSheet({
          title: 'Note', label: `For ${entry.name}`, value: entry.userNote,
          placeholder: 'e.g. left shoulder tight, went lighter',
          onSave: v => { entry.userNote = v; S.persistActive(); rerender(view); },
        });
      }),
      listItem('timer', 'Rest time', `${entry.rest}s between sets`, () => {
        close();
        promptSheet({
          title: 'Rest time', label: 'Seconds', type: 'number', value: String(entry.rest),
          onSave: v => { entry.rest = Math.max(0, parseInt(v, 10) || 0); S.persistActive(); rerender(view); },
        });
      }),
      listItem('swap', 'Swap exercise', 'Machine taken? Pick another', () => {
        close();
        exercisePicker({
          title: 'Swap in',
          onPick: (ex) => {
            const keepSets = entry.sets.length;
            Object.assign(entry, {
              exerciseId: ex.id, name: ex.name, type: ex.type,
              sets: Array.from({ length: keepSets }, () => ({ done: false })),
              note: '', targetReps: null,
            });
            S.persistActive(); rerender(view);
            toast(`Swapped to ${ex.name}`);
          },
        });
      }),
      ei > 0 && listItem('back', 'Move up', 'Do this one earlier', () => {
        close();
        [a.entries[ei - 1], a.entries[ei]] = [a.entries[ei], a.entries[ei - 1]];
        S.persistActive(); rerender(view);
      }),
      ei < a.entries.length - 1 && listItem('chevron', 'Move down', 'Do this one later', () => {
        close();
        [a.entries[ei + 1], a.entries[ei]] = [a.entries[ei], a.entries[ei + 1]];
        S.persistActive(); rerender(view);
      }),
      listItem('trash', 'Remove from workout', 'Skip it today', () => {
        close();
        a.entries.splice(ei, 1);
        S.persistActive(); rerender(view);
        toast('Removed');
      }, true),
    ),
  ));
}

function listItem(ic, title, sub, onClick, danger = false) {
  return h('button', { class: 'list-btn', onClick },
    h('span', { class: 'icon-btn plain', style: danger ? { color: 'var(--crit)' } : {} }, icon(ic)),
    h('span', { class: 'g' },
      h('span', { class: 't', style: danger ? { color: 'var(--crit)' } : {} }, title),
      h('span', { class: 's' }, sub)),
  );
}

function addExercise(view) {
  exercisePicker({
    title: 'Add exercise',
    onPick: (ex) => {
      S.state.active.entries.push({
        exerciseId: ex.id, name: ex.name, type: ex.type,
        rest: S.state.settings.restDefault, targetReps: null, perSide: false,
        note: '', userNote: '',
        sets: Array.from({ length: 3 }, () => ({ done: false })),
      });
      S.persistActive(); rerender(view);
      toast(`Added ${ex.name}`);
    },
  });
}

async function finish(view) {
  const a = S.state.active;
  const logged = a.entries.reduce((n, e) => n + e.sets.filter(st => S.isSetLogged(st, e.type)).length, 0);
  if (!logged) {
    return confirmSheet({
      title: 'Nothing logged yet',
      message: 'You have not recorded a single set. Finishing now will just discard the workout.',
      confirmText: 'Discard it', danger: true,
      onConfirm: async () => { stopRest(); await S.discardActive(); go('/'); },
    });
  }

  confirmSheet({
    title: 'Finish workout?',
    message: `${logged} set${logged === 1 ? '' : 's'} logged over ${fmtDuration((Date.now() - a.startedAt) / 1000)}. Unlogged sets are dropped.`,
    confirmText: 'Finish and save',
    onConfirm: async () => {
      stopRest();
      teardownSession();
      const done = await S.finishSession();
      if (!done) { toast('Nothing to save'); return go('/'); }
      go(`/workout/${done.id}?celebrate=1`);
    },
  });
}

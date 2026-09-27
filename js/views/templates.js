/** Template list, detail (with the "why"), and the editor. */
import { h, icon, frag, sheet, confirmSheet, promptSheet, toast, fmtDay, empty } from '../ui.js';
import * as S from '../store.js';
import { go, back } from '../router.js';
import { exercisePicker } from './picker.js';
import { MUSCLES } from '../data/exercises.js';
import { TEMPLATES, ROTATION } from '../data/templates.js';

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */
export function templatesView() {
  const view = h('div', { class: 'view' });
  const all = S.allTemplates();
  const rotation = all.filter(t => ROTATION.includes(t.id)).sort((a, b) => (a.day || 0) - (b.day || 0));
  const extras = all.filter(t => !ROTATION.includes(t.id));

  view.append(
    h('div', { class: 'card', style: { marginTop: '4px' } },
      h('div', { class: 'row' },
        h('span', { class: 'icon-btn', style: { background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none' } }, icon('target')),
        h('div', { style: { flex: '1' } },
          h('div', { style: { fontWeight: '680' } }, 'Your 4-day rotation'),
          h('div', { class: 'xsmall dim' }, 'Run them in order, rest a day whenever you need it'),
        ),
      ),
    ),
    h('div', { class: 'section-title' }, 'Strength rotation'),
    h('div', { class: 'stack' }, ...rotation.map((t, i) => templateRow(t, false, i + 1))),
    h('div', { class: 'section-title' }, 'Anytime'),
    h('div', { class: 'stack' }, ...extras.map(t => templateRow(t, true))),
    h('div', { class: 'stack', style: { marginTop: '18px' } },
      h('button', { class: 'btn btn-outline btn-block', onClick: newTemplate },
        icon('plus'), 'Create a template'),
      h('button', { class: 'btn btn-ghost btn-block', onClick: startFreestyle },
        icon('play'), 'Start an empty workout'),
    ),
  );

  const hidden = S.hiddenTemplates();
  if (hidden.length) {
    view.append(h('button', {
      class: 'btn btn-ghost btn-block btn-sm', style: { marginTop: '10px' },
      onClick: () => restoreSheet(hidden),
    }, `Restore ${hidden.length} deleted workout${hidden.length === 1 ? '' : 's'}`));
  }
  return view;
}

function restoreSheet(hidden) {
  sheet(close => frag(
    h('h2', {}, 'Deleted workouts'),
    h('p', { class: 'muted small', style: { marginTop: '6px' } },
      'Built-in workouts are only hidden, never erased. Bring one back below.'),
    h('div', { style: { marginTop: '12px' } }, ...hidden.map(t =>
      h('button', { class: 'list-btn', onClick: async () => {
        await S.resetTemplate(t.id);
        close();
        toast(`${t.name} restored`);
        go('/templates');
      } },
        h('span', { class: 'g' },
          h('span', { class: 't' }, t.name),
          h('span', { class: 's' }, t.subtitle)),
        h('span', { style: { color: 'var(--accent)', display: 'flex' } }, icon('plus')),
      ))),
    h('div', { class: 'sheet-actions' },
      h('button', { class: 'btn btn-lg btn-block btn-ghost', onClick: close }, 'Close')),
  ));
}

function templateRow(t, alt = false, order = null) {
  const last = S.state.sessions.find(s => s.templateId === t.id);
  return h('button', { class: 'tpl', onClick: () => go(`/template/${t.id}`) },
    h('div', { class: `tpl-badge ${alt ? 'alt' : ''}` },
      alt ? icon(t.id === 'mobility' ? 'stretch' : 'flame') : String(order ?? t.day ?? '')),
    h('div', { class: 'tpl-body' },
      h('div', { class: 't' }, t.name),
      h('div', { class: 's' },
        `${t.blocks.length} exercises · ~${t.estMin} min` + (last ? ` · ${fmtDay(last.startedAt).toLowerCase()}` : '')),
    ),
    h('span', { class: 'chev' }, icon('chevron')),
  );
}

/* ------------------------------------------------------------------ */
/* Detail                                                              */
/* ------------------------------------------------------------------ */
export function templateDetailView(id) {
  const t = S.templateById(id);
  const view = h('div', { class: 'view' });
  if (!t) { view.append(empty('info', 'Template not found')); return view; }

  const isBuiltIn = TEMPLATES.some(b => b.id === t.id);
  const edited = S.state.customTemplates.some(c => c.id === t.id) && isBuiltIn;

  view.append(
    h('div', { class: 'card', style: { marginTop: '4px' } },
      h('h1', {}, t.name),
      h('p', { class: 'muted small', style: { marginTop: '4px' } },
        `${t.subtitle} · ${t.blocks.length} exercises · ~${t.estMin} min`),
      h('div', { class: 'row', style: { marginTop: '11px', flexWrap: 'wrap', gap: '6px' } },
        ...(t.focus || []).map(f => h('span', { class: 'chip' }, MUSCLES[f] || f)),
        edited && h('span', { class: 'chip chip-accent' }, 'edited'),
      ),
      t.why && h('div', { class: 'cue', style: { margin: '13px 0 0', borderRadius: '0 8px 8px 0' } }, t.why),
      h('button', {
        class: 'btn btn-primary btn-lg btn-block', style: { marginTop: '14px' },
        onClick: async () => {
          if (S.state.active) {
            return confirmSheet({
              title: 'You already have a workout going',
              message: `"${S.state.active.name}" is still in progress. Starting a new one discards it.`,
              confirmText: 'Discard and start new', danger: true,
              onConfirm: async () => { await S.startSession(t); go('/session'); },
            });
          }
          await S.startSession(t);
          go('/session');
        },
      }, icon('play'), 'Start workout'),
    ),
  );

  view.append(h('div', { class: 'section-title' }, 'Exercises'));
  const list = h('div', { class: 'card' });
  t.blocks.forEach((b, i) => {
    const ex = S.exerciseById(b.exerciseId);
    if (!ex) return;
    list.append(h('div', { class: 'edit-row' },
      h('span', { class: 'tnum dim', style: { width: '18px', fontSize: '13px', fontWeight: '700' } }, String(i + 1)),
      h('div', { class: 'g' },
        h('div', { class: 't' }, ex.name),
        h('div', { class: 's' }, blockSummary(b, ex)),
      ),
      h('button', { class: 'icon-btn plain', 'aria-label': `How to do ${ex.name}`,
        onClick: () => sheet(close => frag(
          h('h2', {}, ex.name),
          h('p', { class: 'muted small', style: { marginTop: '8px' } },
            ex.primary.map(m => MUSCLES[m] || m).join(', ')),
          h('p', { style: { marginTop: '12px', lineHeight: '1.6' } }, ex.cue),
          b.note && h('div', { class: 'cue', style: { margin: '14px 0 0' } }, b.note),
          h('div', { class: 'sheet-actions' },
            h('button', { class: 'btn btn-lg btn-block btn-primary', onClick: close }, 'Close')),
        )) }, icon('info')),
    ));
  });
  view.append(list);

  view.append(h('div', { class: 'stack', style: { marginTop: '16px' } },
    h('button', { class: 'btn btn-outline btn-block', onClick: () => renameTemplate(t) },
      icon('edit'), 'Rename'),
    h('button', { class: 'btn btn-outline btn-block', onClick: () => go(`/template/${t.id}/edit`) },
      icon('edit'), 'Edit exercises'),
    h('button', { class: 'btn btn-ghost btn-block', onClick: () => duplicate(t) },
      icon('copy'), 'Duplicate'),
    edited && h('button', { class: 'btn btn-ghost btn-block', onClick: () => confirmSheet({
      title: 'Reset to the original?',
      message: 'Your edits to this built-in template will be undone, including the name.',
      confirmText: 'Reset', danger: true,
      onConfirm: async () => { await S.resetTemplate(t.id); toast('Reset'); go(`/template/${t.id}`); },
    }) }, 'Reset to original'),
    h('button', { class: 'btn btn-danger btn-block', onClick: () => confirmSheet({
      title: `Delete "${t.name}"?`,
      message: isBuiltIn
        ? 'It comes off your list. Workouts you already logged from it are kept, and you can restore it any time from the bottom of the Workouts tab.'
        : 'Workouts you already logged from it are kept. This template cannot be brought back.',
      confirmText: 'Delete workout', danger: true,
      onConfirm: async () => { await S.deleteTemplate(t.id); toast('Deleted'); go('/templates'); },
    }) }, icon('trash'), 'Delete'),
  ));

  return view;
}

function blockSummary(b, ex) {
  const bits = [];
  if (ex.type === 'cardio') {
    bits.push(`${b.min} min`, b.incline ? `${b.incline}% incline` : null, b.speed ? `${b.speed} mph` : null);
  } else if (ex.type === 'time') {
    bits.push(`${b.sets} × ${b.time}s${b.perSide ? '/side' : ''}`);
  } else {
    bits.push(`${b.sets} × ${b.reps || '—'}${b.perSide ? '/side' : ''}`);
  }
  if (b.rest) bits.push(`${b.rest}s rest`);
  return bits.filter(Boolean).join(' · ');
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */
export function templateEditView(id) {
  const original = S.templateById(id);
  const view = h('div', { class: 'view' });
  if (!original) { view.append(empty('info', 'Template not found')); return view; }

  const draft = structuredClone(original);
  const body = h('div');

  const paint = () => {
    body.replaceChildren();

    body.append(
      h('div', { class: 'card', style: { marginTop: '4px' } },
        h('div', { class: 'stack' },
          h('div', { class: 'field' },
            h('label', {}, 'Name'),
            h('input', { class: 'input', value: draft.name, onInput: e => { draft.name = e.target.value; } })),
          h('div', { class: 'field' },
            h('label', {}, 'Subtitle'),
            h('input', { class: 'input', value: draft.subtitle || '', onInput: e => { draft.subtitle = e.target.value; } })),
        ),
      ),
      h('div', { class: 'section-title' }, `Exercises (${draft.blocks.length})`),
    );

    const list = h('div', { class: 'card' });
    draft.blocks.forEach((b, i) => {
      const ex = S.exerciseById(b.exerciseId);
      if (!ex) return;
      list.append(h('div', { class: 'edit-row' },
        h('div', { class: 'g', onClick: () => editBlock(b, ex, paint), style: { cursor: 'pointer' } },
          h('div', { class: 't' }, ex.name),
          h('div', { class: 's' }, blockSummary(b, ex)),
        ),
        h('button', { class: 'icon-btn plain', 'aria-label': 'Move up', disabled: i === 0,
          onClick: () => { [draft.blocks[i - 1], draft.blocks[i]] = [draft.blocks[i], draft.blocks[i - 1]]; paint(); } },
          icon('back')),
        h('button', { class: 'icon-btn plain', 'aria-label': 'Move down', disabled: i === draft.blocks.length - 1,
          onClick: () => { [draft.blocks[i + 1], draft.blocks[i]] = [draft.blocks[i], draft.blocks[i + 1]]; paint(); } },
          icon('chevron')),
        h('button', { class: 'icon-btn plain', 'aria-label': 'Remove', style: { color: 'var(--crit)' },
          onClick: () => { draft.blocks.splice(i, 1); paint(); } }, icon('trash')),
      ));
    });
    if (!draft.blocks.length) list.append(empty('dumbbell', 'No exercises yet'));
    body.append(list);

    body.append(h('div', { class: 'stack', style: { marginTop: '14px' } },
      h('button', { class: 'btn btn-outline btn-block', onClick: () => exercisePicker({
        title: 'Add to template',
        onPick: (ex) => {
          draft.blocks.push({
            exerciseId: ex.id, sets: 3, rest: S.state.settings.restDefault,
            ...(ex.type === 'cardio' ? { min: 15, incline: 8, speed: 3.0, sets: 1, rest: 0 }
              : ex.type === 'time' ? { time: 30 } : { reps: '10-12' }),
          });
          paint();
        },
      }) }, icon('plus'), 'Add exercise'),
      h('button', { class: 'btn btn-primary btn-lg btn-block', onClick: async () => {
        draft.estMin = Math.max(10, Math.round(draft.blocks.reduce((m, b) => {
          const ex = S.exerciseById(b.exerciseId);
          if (ex?.type === 'cardio') return m + (b.min || 0);
          return m + (b.sets || 1) * ((b.rest || 60) + 40) / 60;
        }, 0)));
        await S.saveTemplate(draft);
        toast('Template saved');
        go(`/template/${draft.id}`);
      } }, icon('check'), 'Save template'),
      h('button', { class: 'btn btn-ghost btn-block', onClick: () => back() }, 'Cancel'),
    ));
  };

  paint();
  view.append(body);
  return view;
}

function editBlock(b, ex, paint) {
  sheet(close => {
    const fields = [];
    const mk = (label, key, opts = {}) => {
      const input = h('input', { class: 'input', value: b[key] ?? '', ...opts });
      fields.push([key, input, opts.parse]);
      return h('div', { class: 'field' }, h('label', {}, label), input);
    };

    const rows = ex.type === 'cardio'
      ? [mk('Minutes', 'min', { type: 'number', parse: Number }),
         mk('Incline %', 'incline', { type: 'number', parse: Number }),
         mk('Speed (mph)', 'speed', { type: 'number', step: '0.1', parse: Number })]
      : ex.type === 'time'
        ? [mk('Sets', 'sets', { type: 'number', parse: Number }),
           mk('Seconds per set', 'time', { type: 'number', parse: Number })]
        : [mk('Sets', 'sets', { type: 'number', parse: Number }),
           mk('Target reps', 'reps', { placeholder: 'e.g. 8-12 or AMRAP' })];

    rows.push(mk('Rest (seconds)', 'rest', { type: 'number', parse: Number }));

    const perSide = h('input', { type: 'checkbox', checked: !!b.perSide });
    const note = h('textarea', { class: 'input', rows: 2, value: b.note || '' });

    return h('form', { onSubmit: (e) => {
      e.preventDefault();
      fields.forEach(([key, input, parse]) => {
        const v = input.value;
        b[key] = parse ? (v === '' ? null : parse(v)) : v;
      });
      b.perSide = perSide.checked;
      b.note = note.value;
      close(); paint();
    } },
      h('h2', {}, ex.name),
      h('div', { class: 'stack', style: { marginTop: '14px' } },
        ...rows,
        h('div', { class: 'spread' },
          h('label', { style: { fontWeight: '640', fontSize: '14.5px' } }, 'Counted per side'),
          h('span', { class: 'switch' }, perSide, h('span', { class: 'track' }), h('span', { class: 'thumb' })),
        ),
        h('div', { class: 'field' }, h('label', {}, 'Coaching note'), note),
      ),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn btn-lg btn-block btn-primary', type: 'submit' }, 'Done'),
        h('button', { class: 'btn btn-lg btn-block btn-ghost', type: 'button', onClick: close }, 'Cancel'),
      ),
    );
  });
}

/* ------------------------------------------------------------------ */
function renameTemplate(t) {
  promptSheet({
    title: 'Rename workout', label: 'Name', value: t.name,
    hint: 'Call it whatever you actually call it.',
    onSave: async (name) => {
      const next = name.trim();
      if (!next) return toast('Give it a name');
      await S.saveTemplate({ ...structuredClone(t), name: next });
      toast('Renamed');
      go(`/template/${t.id}`);
    },
  });
}

function duplicate(t) {
  promptSheet({
    title: 'Duplicate template', label: 'New name', value: `${t.name} (copy)`,
    onSave: async (name) => {
      const copy = structuredClone(t);
      copy.id = 'tpl_' + S.uid();
      copy.name = name || `${t.name} (copy)`;
      delete copy.day;
      copy.standalone = true;
      await S.saveTemplate(copy);
      toast('Duplicated');
      go(`/template/${copy.id}`);
    },
  });
}

function newTemplate() {
  promptSheet({
    title: 'New template', label: 'Name', placeholder: 'e.g. Quick Lunch Session',
    onSave: async (name) => {
      if (!name.trim()) return toast('Give it a name');
      const tpl = {
        id: 'tpl_' + S.uid(), name: name.trim(), subtitle: 'Custom workout',
        focus: [], estMin: 30, standalone: true, blocks: [],
      };
      await S.saveTemplate(tpl);
      go(`/template/${tpl.id}/edit`);
    },
  });
}

async function startFreestyle() {
  if (S.state.active) {
    return confirmSheet({
      title: 'You already have a workout going',
      message: `"${S.state.active.name}" is still in progress.`,
      confirmText: 'Discard and start new', danger: true,
      onConfirm: async () => { await S.startSession(null); go('/session'); },
    });
  }
  await S.startSession(null);
  go('/session');
}

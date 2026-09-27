/** Searchable exercise picker + custom exercise creation. */
import { h, icon, frag, sheet, toast } from '../ui.js';
import * as S from '../store.js';
import { MUSCLES } from '../data/exercises.js';

const GROUPS = [
  ['all', 'All'],
  ['calisthenics', 'Calisthenics'],
  ['chest', 'Chest'], ['back', 'Back'], ['shoulders', 'Shoulders'],
  ['biceps', 'Biceps'], ['triceps', 'Triceps'],
  ['abs', 'Core'], ['obliques', 'Obliques'],
  ['quads', 'Legs'], ['glutes', 'Glutes'],
  ['cardio', 'Cardio'], ['mobility', 'Mobility'],
];

const LEG_KEYS = ['quads', 'hamstrings', 'calves'];

export function exercisePicker({ title = 'Choose an exercise', onPick }) {
  sheet(close => {
    let query = '';
    let group = 'all';

    const list = h('div', { style: { maxHeight: '48vh', overflowY: 'auto', marginTop: '4px' } });

    const matches = () => {
      const q = query.trim().toLowerCase();
      return S.allExercises().filter(ex => {
        if (q && !ex.name.toLowerCase().includes(q)
            && !ex.primary.some(m => (MUSCLES[m] || m).toLowerCase().includes(q))) return false;
        if (group === 'all') return true;
        if (group === 'calisthenics') return ex.tags?.includes('calisthenics');
        if (group === 'mobility') return ex.primary.includes('mobility') || ex.tags?.includes('mobility');
        if (group === 'quads') return [...ex.primary, ...ex.secondary].some(m => LEG_KEYS.includes(m));
        return ex.primary.includes(group) || ex.secondary.includes(group);
      });
    };

    const paint = () => {
      const rows = matches();
      list.replaceChildren();
      if (!rows.length) {
        list.append(h('p', { class: 'muted small', style: { padding: '22px 4px', textAlign: 'center' } },
          'Nothing matches. Try another word, or create a custom exercise below.'));
        return;
      }
      rows.forEach(ex => list.append(
        h('button', { class: 'list-btn', onClick: () => { close(); onPick(ex); } },
          h('span', { class: 'g' },
            h('span', { class: 't' }, ex.name),
            h('span', { class: 's' },
              [ex.primary.map(m => MUSCLES[m] || m).join(', '),
               TYPE_LABEL[ex.type]].filter(Boolean).join(' · ')),
          ),
          h('span', { class: 'chev', style: { color: 'var(--text-3)' } }, icon('plus')),
        ),
      ));
    };

    const search = h('input', {
      class: 'input', type: 'search', placeholder: 'Search exercises…',
      onInput: e => { query = e.target.value; paint(); },
    });

    const pills = h('div', { class: 'pill-tabs' }, ...GROUPS.map(([k, label]) =>
      h('button', { 'aria-pressed': String(k === group), onClick: (e) => {
        group = k;
        pills.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
        e.currentTarget.setAttribute('aria-pressed', 'true');
        paint();
      } }, label)));

    paint();

    return frag(
      h('h2', {}, title),
      h('div', { style: { marginTop: '12px' } }, search),
      pills,
      list,
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn btn-block btn-outline', onClick: () => { close(); customExerciseSheet(onPick); } },
          icon('plus'), 'Create a custom exercise'),
        h('button', { class: 'btn btn-block btn-ghost', onClick: close }, 'Cancel'),
      ),
    );
  });
}

const TYPE_LABEL = {
  weight_reps: 'weight × reps',
  reps: 'bodyweight reps',
  time: 'timed hold',
  cardio: 'treadmill',
};

export function customExerciseSheet(onPick) {
  sheet(close => {
    const name = h('input', { class: 'input', placeholder: 'e.g. Leg Press' });
    const type = h('select', { class: 'input' },
      ...Object.entries(TYPE_LABEL).map(([v, l]) => h('option', { value: v }, l)));
    const muscle = h('select', { class: 'input' },
      ...Object.entries(MUSCLES).map(([v, l]) => h('option', { value: v }, l)));
    const cue = h('textarea', { class: 'input', rows: 2, placeholder: 'Form notes (optional)' });

    const save = async (e) => {
      e.preventDefault();
      if (!name.value.trim()) return toast('Give it a name');
      const ex = {
        id: 'custom_' + S.uid(),
        name: name.value.trim(),
        type: type.value,
        primary: [muscle.value],
        secondary: [],
        equipment: ['custom'],
        cue: cue.value.trim(),
        tags: ['custom'],
        custom: true,
      };
      await S.saveCustomExercise(ex);
      close();
      toast(`Created ${ex.name}`);
      onPick?.(ex);
    };

    return h('form', { onSubmit: save },
      h('h2', {}, 'Custom exercise'),
      h('div', { class: 'stack', style: { marginTop: '14px' } },
        h('div', { class: 'field' }, h('label', {}, 'Name'), name),
        h('div', { class: 'field' }, h('label', {}, 'How it is logged'), type),
        h('div', { class: 'field' }, h('label', {}, 'Main muscle'), muscle),
        h('div', { class: 'field' }, h('label', {}, 'Form notes'), cue),
      ),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn btn-lg btn-block btn-primary', type: 'submit' }, 'Create'),
        h('button', { class: 'btn btn-lg btn-block btn-ghost', type: 'button', onClick: close }, 'Cancel'),
      ),
    );
  });
}

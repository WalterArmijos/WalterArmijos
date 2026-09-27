import { h, icon, frag, fmtDuration, fmtVolume, fmtDay, promptSheet, toast, empty } from '../ui.js';
import * as S from '../store.js';
import { go } from '../router.js';

export function homeView() {
  const { settings } = S.state;
  const week = S.weekMap();
  const weekSessions = S.sessionsThisWeek();
  const { template: next, lastDone } = S.nextUp();
  const cur = S.currentWeight();
  const trend = S.weightTrend();
  const lost = settings.startWeight - cur;
  const toGo = cur - settings.goalWeight;

  const view = h('div', { class: 'view' });

  /* ---------------- hero: next workout ---------------- */
  if (S.state.active) {
    const done = S.state.active.entries.reduce((n, e) => n + e.sets.filter(x => x.done).length, 0);
    const total = S.state.active.entries.reduce((n, e) => n + e.sets.length, 0);
    view.append(h('div', { class: 'hero' },
      h('div', { class: 'label' }, 'Workout in progress'),
      h('h2', {}, S.state.active.name),
      h('div', { class: 'meta' }, `${done} of ${total} sets logged · started ${fmtDay(S.state.active.startedAt).toLowerCase()}`),
      h('button', { class: 'btn btn-block', onClick: () => go('/session') },
        icon('play'), 'Resume workout'),
    ));
  } else if (next) {
    view.append(h('div', { class: 'hero' },
      h('div', { class: 'label' }, 'Next up'),
      h('h2', {}, next.name),
      h('div', { class: 'meta' },
        `${next.subtitle} · ~${next.estMin} min` +
        (lastDone ? ` · last done ${fmtDay(lastDone).toLowerCase()}` : ' · never done')),
      h('button', { class: 'btn btn-block', onClick: () => go(`/template/${next.id}`) },
        icon('play'), 'Start this workout'),
    ));
  }

  /* ---------------- this week ---------------- */
  view.append(
    h('div', { class: 'section-title' }, 'This week'),
    h('div', { class: 'card' },
      h('div', { class: 'week-dots' }, ...week.map(d =>
        h('div', { class: `d ${d.done ? 'done' : ''} ${d.isToday ? 'today' : ''}`,
          title: d.date.toDateString() }, d.label))),
      h('div', { class: 'spread', style: { marginTop: '13px' } },
        h('div', {},
          h('div', { style: { fontWeight: '680' } },
            weekSessions.length >= 4
              ? `${weekSessions.length} workout${weekSessions.length === 1 ? '' : 's'} this week`
              : `${weekSessions.length} of 4 workouts`),
          h('div', { class: 'xsmall dim' },
            weekSessions.length > 4 ? 'Above target. Watch that you are still recovering.'
              : weekSessions.length === 4 ? 'Week complete. Good work.'
              : weekSessions.length === 0 ? 'Nothing logged yet — get one in.'
              : `${4 - weekSessions.length} to go`),
        ),
        S.weekStreak() > 0 && h('span', { class: 'chip chip-accent' },
          icon('flame'), `${S.weekStreak()} week streak`),
      ),
    ),
  );

  /* ---------------- quick stats ---------------- */
  const weekVol = weekSessions.reduce((v, s) => v + (s.volume || 0), 0);
  const weekMin = Math.round(weekSessions.reduce((m, s) => m + s.durationSec, 0) / 60);
  const weekCal = weekSessions.reduce((c, s) => c + (s.calories || 0), 0);

  view.append(
    h('div', { class: 'stat-row', style: { marginTop: '12px' } },
      stat('Volume', fmtVolume(weekVol), 'lb'),
      stat('Time', String(weekMin), 'min'),
      stat('Burned', fmtVolume(weekCal), 'kcal'),
    ),
  );

  /* ---------------- body weight ---------------- */
  view.append(
    h('div', { class: 'section-title' }, 'Body weight'),
    h('div', { class: 'card' },
      h('div', { class: 'spread' },
        h('div', {},
          h('div', { class: 'xsmall dim', style: { fontWeight: '700', letterSpacing: '.05em', textTransform: 'uppercase' } }, 'Current'),
          h('div', { style: { fontSize: '30px', fontWeight: '760', letterSpacing: '-.02em', lineHeight: '1.1' } },
            h('span', { class: 'tnum' }, cur.toFixed(1)),
            h('span', { style: { fontSize: '15px', color: 'var(--text-3)', marginLeft: '4px', fontWeight: '650' } }, 'lb')),
          trend?.delta != null && h('div', { class: 'small', style: {
            marginTop: '3px', fontWeight: '650',
            color: trend.delta < 0 ? 'var(--good)' : trend.delta > 0.3 ? 'var(--warn)' : 'var(--text-3)',
          } }, `${trend.delta < 0 ? '▼' : '▲'} ${Math.abs(trend.delta).toFixed(1)} lb vs last week`),
        ),
        h('button', { class: 'btn btn-sm', onClick: openWeighIn }, icon('plus'), 'Log'),
      ),
      h('div', { class: 'divider' }),
      h('div', { class: 'spread small' },
        h('span', { class: 'muted' }, lost > 0 ? `${lost.toFixed(1)} lb down from ${settings.startWeight}` : `Starting point ${settings.startWeight} lb`),
        h('span', { class: 'dim tnum' }, toGo > 0 ? `${toGo.toFixed(1)} lb to goal` : 'Goal reached'),
      ),
      progressBar(settings.startWeight, cur, settings.goalWeight),
    ),
  );

  /* ---------------- recent ---------------- */
  view.append(h('div', { class: 'section-title' }, 'Recent workouts'));
  const recent = S.state.sessions.slice(0, 3);
  if (!recent.length) {
    view.append(h('div', { class: 'card' }, empty('history', 'No workouts yet',
      'Pick a template and hit start — the first one is the hard one.')));
  } else {
    view.append(h('div', { class: 'stack' }, ...recent.map(s => sessionRow(s))));
    if (S.state.sessions.length > 3) {
      view.append(h('button', {
        class: 'btn btn-block btn-ghost btn-sm', style: { marginTop: '10px' },
        onClick: () => go('/history'),
      }, `See all ${S.state.sessions.length} workouts`));
    }
  }

  return view;
}

function stat(k, v, u) {
  return h('div', { class: 'stat' },
    h('div', { class: 'k' }, k),
    h('div', { class: 'v tnum' }, v, h('span', { class: 'u' }, u)),
  );
}

function progressBar(start, cur, goal) {
  const span = start - goal;
  const pct = span > 0 ? Math.min(100, Math.max(0, ((start - cur) / span) * 100)) : 0;
  return h('div', { style: { marginTop: '10px' } },
    h('div', { style: { height: '8px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden' } },
      h('i', { style: { display: 'block', height: '100%', width: `${Math.max(2, pct)}%`,
        background: 'var(--accent)', borderRadius: '999px', transition: 'width .4s ease' } })),
    h('div', { class: 'xsmall dim', style: { marginTop: '5px', textAlign: 'right' } },
      `${Math.round(pct)}% of the way to ${goal} lb`),
  );
}

export function sessionRow(s) {
  const d = new Date(s.startedAt);
  return h('button', { class: 'hist', onClick: () => go(`/workout/${s.id}`) },
    h('div', { class: 'date' },
      h('div', { class: 'm' }, d.toLocaleDateString(undefined, { month: 'short' })),
      h('div', { class: 'd tnum' }, d.getDate()),
    ),
    h('div', { class: 'g' },
      h('div', { class: 't' }, s.name),
      h('div', { class: 's' },
        [`${s.setCount} set${s.setCount === 1 ? '' : 's'}`,
         s.volume > 0 && `${fmtVolume(s.volume)} lb`,
         fmtDuration(s.durationSec),
         s.calories > 0 && `${s.calories} kcal`].filter(Boolean).join(' · ')),
    ),
    h('span', { class: 'chev' }, icon('chevron')),
  );
}

export function openWeighIn() {
  promptSheet({
    title: 'Log body weight',
    label: 'Weight (lb)',
    type: 'number',
    value: String(S.currentWeight()),
    hint: 'Weigh in first thing in the morning, after the bathroom, before eating — same conditions every time. Day-to-day swings are water, not fat.',
    saveText: 'Save weigh-in',
    onSave: async (v) => {
      const lb = parseFloat(v);
      if (!lb || lb < 50 || lb > 700) return toast('That does not look right.');
      await S.logWeight(lb);
      toast(`Logged ${lb} lb`);
    },
  });
}

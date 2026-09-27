/** Progress: body weight trend, weekly work, per-exercise strength. */
import { h, icon, frag, sheet, empty, fmtVolume, fmtDate, fmtDay, toast, confirmSheet } from '../ui.js';
import * as S from '../store.js';
import { lineChart, barChart, rankBars } from '../charts.js';
import { openWeighIn } from './home.js';
import { MUSCLES } from '../data/exercises.js';

export function progressView() {
  const view = h('div', { class: 'view' });
  const { settings } = S.state;

  /* -------------------- body weight -------------------- */
  const bw = S.state.bodyweight;
  const wCard = h('div', { class: 'card', style: { marginTop: '4px' } },
    h('div', { class: 'card-head' },
      h('h3', {}, 'Body weight'),
      h('button', { class: 'btn btn-sm', onClick: openWeighIn }, icon('plus'), 'Log')),
  );

  if (bw.length >= 2) {
    const pts = bw.map(w => ({ x: new Date(w.date + 'T12:00').getTime(), y: w.lb, label: fmtDate(new Date(w.date + 'T12:00').getTime()) }));
    wCard.append(lineChart(pts, {
      format: v => `${v.toFixed(0)}`,
      goal: settings.goalWeight, goalLabel: 'Goal',
      tableHeaders: ['Date', 'Weight (lb)'],
    }));
    const trend = S.weightTrend();
    const total = settings.startWeight - S.currentWeight();
    wCard.append(h('div', { class: 'spread small', style: { marginTop: '12px' } },
      h('span', { class: 'muted' }, `${bw.length} weigh-ins logged`),
      h('span', { style: { fontWeight: '680', color: total > 0 ? 'var(--good)' : 'var(--text-3)' } },
        total > 0 ? `${total.toFixed(1)} lb down` : 'No change yet'),
    ));
    if (trend?.delta != null) {
      const perWeek = trend.delta;
      wCard.append(h('p', { class: 'xsmall dim', style: { marginTop: '6px', lineHeight: '1.5' } },
        perWeek < -0.2
          ? `Trending down about ${Math.abs(perWeek).toFixed(1)} lb per week. Between 1 and 2 lb a week is the sweet spot — faster than that and you start losing muscle with it.`
          : perWeek > 0.4
            ? 'Trending up week over week. Worth a look at food intake before you change anything in the gym.'
            : 'Holding roughly steady. If the scale stalls for two-plus weeks, add a treadmill session rather than cutting food further.'));
    }
  } else {
    wCard.append(h('p', { class: 'muted small', style: { padding: '6px 0 4px' } },
      bw.length === 1
        ? 'One weigh-in down. Log a few more and the trend line shows up here.'
        : `Starting point is ${settings.startWeight} lb with a goal of ${settings.goalWeight} lb. Log your first weigh-in to start the chart.`));
  }
  view.append(wCard);

  if (bw.length >= 1) {
    view.append(h('button', {
      class: 'btn btn-ghost btn-block btn-sm', style: { marginTop: '8px' }, onClick: weighInLog,
    }, 'All weigh-ins'));
  }

  /* -------------------- energy -------------------- */
  const e = S.energyTargets();
  view.append(
    h('div', { class: 'section-title' }, 'Your numbers'),
    h('div', { class: 'card' },
      row('Height', `5'7"`),
      row('BMI', String(S.bmi())),
      row('Resting burn (BMR)', `${e.bmr.toLocaleString()} kcal/day`),
      row('Daily burn, lightly active', `${e.tdee.toLocaleString()} kcal/day`),
      row('To lose ~1 lb/week', `≈ ${e.cut.toLocaleString()} kcal/day`, true),
      h('p', { class: 'xsmall dim', style: { marginTop: '10px', lineHeight: '1.5' } },
        'Estimates from the Mifflin-St Jeor equation — a starting point, not a prescription. Adjust based on what the scale actually does over two or three weeks.'),
    ),
  );

  /* -------------------- weekly work -------------------- */
  const weeks = lastWeeks(8);
  view.append(h('div', { class: 'section-title' }, 'Workouts per week'));
  const wkCard = h('div', { class: 'card' });
  if (S.state.sessions.length) {
    wkCard.append(barChart(weeks.map(w => ({ label: w.short, value: w.count, sub: w.label })), {
      format: v => String(Math.round(v)), tableHeaders: ['Week of', 'Workouts'],
    }));
    const avg = weeks.reduce((n, w) => n + w.count, 0) / weeks.length;
    wkCard.append(h('p', { class: 'xsmall dim', style: { marginTop: '10px' } },
      `Averaging ${avg.toFixed(1)} workouts a week over the last ${weeks.length} weeks. Target is 4.`));
  } else {
    wkCard.append(empty('chart', 'Nothing to chart yet', 'Log a few workouts first.'));
  }
  view.append(wkCard);

  /* -------------------- cardio minutes -------------------- */
  if (S.state.sessions.some(s => s.cardioMin > 0)) {
    const cardio = weeks.map(w => ({ label: w.short, value: w.cardioMin, sub: w.label }));
    view.append(
      h('div', { class: 'section-title' }, 'Treadmill minutes per week'),
      h('div', { class: 'card' },
        barChart(cardio, { format: v => `${Math.round(v)}`, tableHeaders: ['Week of', 'Minutes'] }),
        h('p', { class: 'xsmall dim', style: { marginTop: '10px' } },
          'Incline walking is the lowest-cost fat loss you have — it barely eats into recovery, so more of it is almost always fine.'),
      ),
    );
  }

  /* -------------------- where the work went -------------------- */
  const byMuscle = muscleSplit();
  if (byMuscle.length) {
    view.append(
      h('div', { class: 'section-title' }, 'Where your sets went (last 30 days)'),
      h('div', { class: 'card' },
        rankBars(byMuscle, { format: v => `${v} sets` }),
      ),
    );
  }

  /* -------------------- strength by exercise -------------------- */
  view.append(h('div', { class: 'section-title' }, 'Strength by exercise'));
  const tracked = trackedExercises();
  if (!tracked.length) {
    view.append(h('div', { class: 'card' }, empty('chart', 'No lift history yet',
      'Log an exercise twice and its progress chart shows up here.')));
  } else {
    view.append(h('div', { class: 'stack' }, ...tracked.map(t =>
      h('button', { class: 'tpl', onClick: () => exerciseDetail(t.id) },
        h('div', { class: 'tpl-badge alt' }, icon('chart')),
        h('div', { class: 'tpl-body' },
          h('div', { class: 't' }, t.name),
          h('div', { class: 's' },
            `${t.count} session${t.count === 1 ? '' : 's'} · best ${t.bestLabel}`),
        ),
        h('span', { class: 'chev' }, icon('chevron')),
      ))));
  }

  return view;
}

const row = (k, v, strong = false) => h('div', { class: 'spread', style: { padding: '7px 0' } },
  h('span', { class: 'small muted' }, k),
  h('span', { class: 'small tnum', style: { fontWeight: strong ? '750' : '640', color: strong ? 'var(--accent)' : 'inherit' } }, v));

function lastWeeks(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const from = S.startOfWeek(); from.setDate(from.getDate() - 7 * i);
    const to = new Date(from);    to.setDate(from.getDate() + 7);
    const rows = S.state.sessions.filter(s => s.startedAt >= from.getTime() && s.startedAt < to.getTime());
    out.push({
      short: `${from.getMonth() + 1}/${from.getDate()}`,
      label: `Week of ${fmtDate(from.getTime())}`,
      count: rows.length,
      cardioMin: Math.round(rows.reduce((m, s) => m + (s.cardioMin || 0), 0)),
    });
  }
  return out;
}

function muscleSplit() {
  const since = Date.now() - 30 * 86400000;
  const tally = {};
  for (const s of S.state.sessions) {
    if (s.startedAt < since) continue;
    for (const e of s.entries) {
      const ex = S.exerciseById(e.exerciseId);
      if (!ex) continue;
      for (const m of ex.primary) {
        if (m === 'mobility') continue;
        tally[m] = (tally[m] || 0) + e.sets.length;
      }
    }
  }
  return Object.entries(tally)
    .map(([k, v]) => ({ label: MUSCLES[k] || k, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function trackedExercises() {
  const seen = new Map();
  for (const s of S.state.sessions) {
    for (const e of s.entries) {
      if (e.type === 'cardio') continue;
      const ex = S.exerciseById(e.exerciseId);
      // Stretches belong on the mobility list, not the strength one.
      if (ex?.primary.includes('mobility') || ex?.tags?.includes('mobility')) continue;
      const row = seen.get(e.exerciseId) || { id: e.exerciseId, name: e.name, count: 0, type: e.type };
      row.count++;
      seen.set(e.exerciseId, row);
    }
  }
  return [...seen.values()]
    .filter(r => r.count >= 1)
    .map(r => {
      const best = S.bestSet(r.id);
      return { ...r, bestLabel: bestLabel(r.type, best) };
    })
    .sort((a, b) => b.count - a.count);
}

function bestLabel(type, best) {
  if (!best) return '—';
  const x = best.set;
  if (type === 'weight_reps') return `${x.weight || 0} lb × ${x.reps || 0}`;
  if (type === 'reps')        return `${x.reps || 0} reps`;
  if (type === 'time')        return `${x.timeSec || 0}s`;
  return '—';
}

function exerciseDetail(exerciseId) {
  const hist = S.historyFor(exerciseId);
  const ex = S.exerciseById(exerciseId);
  const type = hist[0]?.entry.type;

  const metric = {
    weight_reps: { label: 'Estimated 1-rep max', fmt: v => `${Math.round(v)} lb` },
    reps:        { label: 'Best set (reps)', fmt: v => `${Math.round(v)}` },
    time:        { label: 'Best hold (seconds)', fmt: v => `${Math.round(v)}s` },
  }[type] || { label: 'Best set', fmt: v => String(Math.round(v)) };

  const pts = hist.map(hh => {
    const best = hh.entry.sets.reduce((m, st) => Math.max(m, S.setScore(hh.entry.type, st)), 0);
    return { x: hh.date, y: best, label: fmtDate(hh.date) };
  }).filter(p => p.y > 0);

  sheet(close => frag(
    h('h2', {}, ex?.name || 'Exercise'),
    h('p', { class: 'muted small', style: { marginTop: '4px' } },
      `${hist.length} session${hist.length === 1 ? '' : 's'} · ${metric.label.toLowerCase()}`),
    pts.length >= 2
      ? h('div', { style: { marginTop: '14px' } },
          lineChart(pts, { format: metric.fmt, tableHeaders: ['Date', metric.label] }))
      : h('p', { class: 'muted small', style: { marginTop: '14px' } },
          'Log this one at least twice to see a trend line.'),
    h('div', { class: 'section-title', style: { marginTop: '18px' } }, 'Session history'),
    h('div', {}, ...hist.slice().reverse().slice(0, 12).map(hh =>
      h('div', { class: 'edit-row' },
        h('div', { class: 'g' },
          h('div', { class: 't', style: { fontSize: '13.5px' } }, fmtDay(hh.date)),
          h('div', { class: 's' }, hh.entry.sets.map(x => setShort(hh.entry.type, x)).join('  ·  ')),
        ),
        hh.entry.sets.some(x => x.isPR) && h('span', { class: 'chip chip-pr' }, 'PR'),
      ))),
    ex?.cue && h('div', { class: 'cue', style: { margin: '16px 0 0' } }, ex.cue),
    h('div', { class: 'sheet-actions' },
      h('button', { class: 'btn btn-lg btn-block btn-primary', onClick: close }, 'Close')),
  ));
}

function setShort(type, x) {
  if (type === 'weight_reps') return `${x.weight || 0}×${x.reps || 0}`;
  if (type === 'reps')        return `${x.reps || 0}`;
  if (type === 'time')        return `${x.timeSec || 0}s`;
  return '—';
}

function weighInLog() {
  sheet(close => frag(
    h('h2', {}, 'Weigh-ins'),
    h('div', { style: { maxHeight: '60vh', overflowY: 'auto', marginTop: '10px' } },
      ...S.state.bodyweight.slice().reverse().map(w =>
        h('div', { class: 'edit-row' },
          h('div', { class: 'g' },
            h('div', { class: 't tnum' }, `${w.lb} lb`),
            h('div', { class: 's' }, fmtDay(new Date(w.date + 'T12:00').getTime())),
          ),
          h('button', { class: 'icon-btn plain', style: { color: 'var(--crit)' }, 'aria-label': 'Delete',
            onClick: () => confirmSheet({
              title: 'Delete this weigh-in?', confirmText: 'Delete', danger: true,
              onConfirm: async () => { await S.deleteWeight(w.date); close(); toast('Deleted'); },
            }) }, icon('trash')),
        ))),
    h('div', { class: 'sheet-actions' },
      h('button', { class: 'btn btn-lg btn-block btn-primary', onClick: close }, 'Close')),
  ));
}

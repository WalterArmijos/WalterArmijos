/**
 * App state + all the domain logic: settings, sessions, PRs, volume,
 * calorie estimates and the "what should I do today" suggestion.
 */
import { db, kv } from './db.js';
import { EXERCISES, EX_BY_ID } from './data/exercises.js';
import { TEMPLATES, ROTATION } from './data/templates.js';

export const DEFAULT_SETTINGS = {
  name: '',
  heightIn: 67,          // 5'7"
  startWeight: 199,
  goalWeight: 175,
  units: 'lb',
  theme: 'system',       // system | light | dark
  restDefault: 90,
  restAuto: true,
  sound: true,
  vibrate: true,
  age: 30,
  sex: 'male',
  keepScreenOn: true,
};

export const state = {
  settings: { ...DEFAULT_SETTINGS },
  sessions: [],          // completed, newest first
  customTemplates: [],
  customExercises: [],
  bodyweight: [],        // ascending by date
  active: null,          // in-progress session
  ready: false,
};

const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const emit = () => listeners.forEach(fn => fn());

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */
export async function loadAll() {
  const [settings, sessions, templates, exercises, bw, active] = await Promise.all([
    kv.get('settings', null),
    db.all('sessions'),
    db.all('templates'),
    db.all('exercises'),
    db.all('bodyweight'),
    kv.get('active', null),
  ]);
  state.settings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  state.sessions = sessions.sort((a, b) => b.startedAt - a.startedAt);
  state.customTemplates = templates;
  state.customExercises = exercises;
  state.bodyweight = bw.sort((a, b) => a.date.localeCompare(b.date));
  state.active = active;
  state.ready = true;
}

export async function saveSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  await kv.set('settings', state.settings);
  emit();
}

/* ------------------------------------------------------------------ */
/* Exercises & templates                                               */
/* ------------------------------------------------------------------ */
export const allExercises = () => [...EXERCISES, ...state.customExercises];

export function exerciseById(id) {
  return EX_BY_ID[id] || state.customExercises.find(e => e.id === id) || null;
}

/** Custom templates override built-ins with the same id. */
export function allTemplates() {
  const custom = new Map(state.customTemplates.map(t => [t.id, t]));
  const merged = TEMPLATES.map(t => custom.get(t.id) || t);
  const extra = state.customTemplates.filter(t => !TEMPLATES.some(b => b.id === t.id));
  return [...merged, ...extra].filter(t => !t.deleted);
}

export const templateById = (id) => allTemplates().find(t => t.id === id) || null;

/** Built-in templates the user has deleted — recoverable, never really gone. */
export function hiddenTemplates() {
  return state.customTemplates
    .filter(t => t.deleted && TEMPLATES.some(b => b.id === t.id))
    .map(t => TEMPLATES.find(b => b.id === t.id));
}

export async function saveTemplate(tpl) {
  tpl.updatedAt = Date.now();
  await db.put('templates', tpl);
  const i = state.customTemplates.findIndex(t => t.id === tpl.id);
  if (i >= 0) state.customTemplates[i] = tpl; else state.customTemplates.push(tpl);
  emit();
}

export async function deleteTemplate(id) {
  const isBuiltIn = TEMPLATES.some(t => t.id === id);
  if (isBuiltIn) {
    await saveTemplate({ ...templateById(id), deleted: true });
  } else {
    await db.del('templates', id);
    state.customTemplates = state.customTemplates.filter(t => t.id !== id);
    emit();
  }
}

/** Restore a built-in template to its shipped version. */
export async function resetTemplate(id) {
  await db.del('templates', id);
  state.customTemplates = state.customTemplates.filter(t => t.id !== id);
  emit();
}

export async function saveCustomExercise(exercise) {
  await db.put('exercises', exercise);
  const i = state.customExercises.findIndex(e => e.id === exercise.id);
  if (i >= 0) state.customExercises[i] = exercise; else state.customExercises.push(exercise);
  emit();
}

/* ------------------------------------------------------------------ */
/* Active session                                                      */
/* ------------------------------------------------------------------ */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function blankSet(block, ex, prev) {
  const s = { done: false };
  if (ex.type === 'weight_reps') { s.weight = prev?.weight ?? null; s.reps = null; }
  else if (ex.type === 'reps')   { s.reps = null; s.weight = null; }
  else if (ex.type === 'time')   { s.timeSec = block.time ?? 30; }
  else if (ex.type === 'cardio') {
    s.min = block.min ?? 15; s.incline = block.incline ?? 0; s.speed = block.speed ?? 3.0;
  }
  return s;
}

/** Build an in-progress session from a template (or an empty freestyle one). */
export function buildSession(tpl) {
  const now = Date.now();
  const entries = (tpl?.blocks ?? []).map(block => {
    const ex = exerciseById(block.exerciseId);
    if (!ex) return null;
    const prevSets = lastPerformance(block.exerciseId)?.sets ?? [];
    return {
      exerciseId: block.exerciseId,
      name: ex.name,
      type: ex.type,
      rest: block.rest ?? state.settings.restDefault,
      targetReps: block.reps ?? null,
      perSide: !!block.perSide,
      note: block.note ?? '',
      userNote: '',
      sets: Array.from({ length: block.sets ?? 3 }, (_, i) => blankSet(block, ex, prevSets[i] ?? prevSets.at(-1))),
    };
  }).filter(Boolean);

  return {
    id: uid(),
    templateId: tpl?.id ?? null,
    name: tpl?.name ?? 'Freestyle Workout',
    startedAt: now,
    entries,
    notes: '',
    restEndsAt: null,
    restTotal: 0,
  };
}

export async function startSession(tpl) {
  state.active = buildSession(tpl);
  await kv.set('active', state.active);
  emit();
  return state.active;
}

export async function persistActive() {
  if (state.active) await kv.set('active', state.active);
  emit();
}

export async function discardActive() {
  state.active = null;
  await kv.del('active');
  emit();
}

/** Finish the active workout and write it to history. */
export async function finishSession() {
  const s = state.active;
  if (!s) return null;

  // Drop sets that were never logged, then drop entries left entirely empty.
  const entries = s.entries
    .map(e => ({ ...e, sets: e.sets.filter(st => isSetLogged(st, e.type)) }))
    .filter(e => e.sets.length > 0);

  const done = {
    id: s.id,
    templateId: s.templateId,
    name: s.name,
    startedAt: s.startedAt,
    endedAt: Date.now(),
    durationSec: Math.max(60, Math.round((Date.now() - s.startedAt) / 1000)),
    notes: s.notes || '',
    entries,
    volume: entries.reduce((sum, e) => sum + entryVolume(e), 0),
    setCount: entries.reduce((n, e) => n + e.sets.length, 0),
    cardioMin: entries.reduce((m, e) => m + (e.type === 'cardio'
      ? e.sets.reduce((x, st) => x + (Number(st.min) || 0), 0) : 0), 0),
  };
  done.calories = estimateCalories(done);

  if (done.setCount === 0) { await discardActive(); return null; }

  await db.put('sessions', done);
  state.sessions.unshift(done);
  state.sessions.sort((a, b) => b.startedAt - a.startedAt);
  await discardActive();
  return done;
}

/** Rename a workout already in your history. */
export async function renameSession(id, name) {
  const s = state.sessions.find(x => x.id === id);
  if (!s) return;
  s.name = (name || '').trim() || s.name;
  await db.put('sessions', s);
  emit();
}

export async function deleteSession(id) {
  await db.del('sessions', id);
  state.sessions = state.sessions.filter(s => s.id !== id);
  emit();
}

/**
 * Was this set actually performed?
 *
 * Timed holds and treadmill blocks arrive pre-filled with the template's
 * targets, so a value alone proves nothing — they only count once checked off.
 * Weight/rep sets start empty, so any entered number counts.
 */
export function isSetLogged(st, type) {
  if (!st) return false;
  if (st.done) return true;
  if (type === 'time' || type === 'cardio') return false;
  return [st.reps, st.weight].some(v => v !== null && v !== undefined && v !== '' && Number(v) > 0);
}

export function entryVolume(entry) {
  if (entry.type === 'weight_reps') {
    return entry.sets.reduce((v, s) => v + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
  }
  if (entry.type === 'reps') {
    // Bodyweight work still moves mass; count it at ~60% of bodyweight per rep
    // for push-ups etc. so progress shows up in the volume trend.
    const bw = currentWeight() * 0.6;
    return entry.sets.reduce((v, s) => v + ((Number(s.weight) || 0) + bw) * (Number(s.reps) || 0), 0);
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/* History lookups                                                     */
/* ------------------------------------------------------------------ */
/** Most recent completed performance of an exercise. */
export function lastPerformance(exerciseId, beforeTs = Infinity) {
  for (const s of state.sessions) {
    if (s.startedAt >= beforeTs) continue;
    const e = s.entries.find(x => x.exerciseId === exerciseId);
    if (e && e.sets.length) return { session: s, sets: e.sets, entry: e };
  }
  return null;
}

export function historyFor(exerciseId) {
  const out = [];
  for (const s of state.sessions) {
    const e = s.entries.find(x => x.exerciseId === exerciseId);
    if (e && e.sets.length) out.push({ date: s.startedAt, entry: e, sessionId: s.id });
  }
  return out.reverse(); // ascending
}

/** Best single set ever, by the metric that matters for that exercise type. */
export function bestSet(exerciseId, excludeSessionId = null) {
  let best = null;
  for (const s of state.sessions) {
    if (s.id === excludeSessionId) continue;
    const e = s.entries.find(x => x.exerciseId === exerciseId);
    if (!e) continue;
    for (const st of e.sets) {
      const score = setScore(e.type, st);
      if (score > 0 && (!best || score > best.score)) best = { score, set: st, type: e.type, date: s.startedAt };
    }
  }
  return best;
}

export function setScore(type, st) {
  if (type === 'weight_reps') return epley(Number(st.weight) || 0, Number(st.reps) || 0);
  if (type === 'reps')        return (Number(st.reps) || 0) + (Number(st.weight) || 0) * 0.5;
  if (type === 'time')        return Number(st.timeSec) || 0;
  if (type === 'cardio')      return (Number(st.min) || 0) * (1 + (Number(st.incline) || 0) / 10);
  return 0;
}

/** Estimated one-rep max (Epley). Reasonable up to ~12 reps. */
export const epley = (weight, reps) =>
  weight > 0 && reps > 0 ? Math.round(weight * (1 + reps / 30)) : 0;

/* ------------------------------------------------------------------ */
/* Body weight                                                         */
/* ------------------------------------------------------------------ */
export const todayKey = (d = new Date()) => {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export async function logWeight(lb, date = todayKey(), note = '') {
  const row = { date, lb: Number(lb), note, at: Date.now() };
  await db.put('bodyweight', row);
  const i = state.bodyweight.findIndex(w => w.date === date);
  if (i >= 0) state.bodyweight[i] = row; else state.bodyweight.push(row);
  state.bodyweight.sort((a, b) => a.date.localeCompare(b.date));
  emit();
}

export async function deleteWeight(date) {
  await db.del('bodyweight', date);
  state.bodyweight = state.bodyweight.filter(w => w.date !== date);
  emit();
}

export function currentWeight() {
  return state.bodyweight.length ? state.bodyweight.at(-1).lb : state.settings.startWeight;
}

/**
 * Moving average over the last `days` days versus the `days` before that.
 * Windowed by date, not by entry count — weighing in every other day would
 * otherwise make a fortnight's loss look like a week's.
 */
export function weightTrend(days = 7) {
  const pts = state.bodyweight;
  if (pts.length < 2) return null;

  const ms = days * 86400000;
  const at = w => new Date(w.date + 'T12:00').getTime();
  const now = at(pts.at(-1));
  const avg = arr => (arr.length ? arr.reduce((a, w) => a + w.lb, 0) / arr.length : null);

  const recent = pts.filter(w => at(w) > now - ms);
  const prior = pts.filter(w => at(w) <= now - ms && at(w) > now - 2 * ms);
  if (!recent.length || !prior.length) return { recent: avg(recent), delta: null };
  return { recent: avg(recent), prior: avg(prior), delta: avg(recent) - avg(prior) };
}

/* ------------------------------------------------------------------ */
/* Energy estimates                                                    */
/* ------------------------------------------------------------------ */
/**
 * Treadmill kcal via the ACSM walking equation — the incline actually counts,
 * which is the whole point of incline walking.
 */
export function treadmillKcal({ min, incline = 0, speed = 3.0 }, weightLb = currentWeight()) {
  if (!min || !speed) return 0;
  const kg = weightLb * 0.4536;
  const mPerMin = speed * 26.8224;           // mph -> m/min
  const grade = (Number(incline) || 0) / 100;
  const vo2 = 3.5 + 0.1 * mPerMin + 1.8 * mPerMin * grade;   // ml/kg/min
  return Math.round((vo2 * kg / 1000) * 5 * min);
}

/** Whole-session estimate: treadmill by equation, lifting at ~5 METs. */
export function estimateCalories(session, weightLb = currentWeight()) {
  let kcal = 0, cardioMin = 0;
  for (const e of session.entries) {
    if (e.type === 'cardio') {
      for (const s of e.sets) {
        kcal += treadmillKcal(s, weightLb);
        cardioMin += Number(s.min) || 0;
      }
    }
  }
  const liftMin = Math.max(0, Math.round(session.durationSec / 60) - cardioMin);
  kcal += Math.round(5 * 3.5 * (weightLb * 0.4536) / 200 * liftMin);
  return Math.round(kcal);
}

/** Mifflin-St Jeor BMR + light-activity TDEE. An estimate, not a prescription. */
export function energyTargets(s = state.settings, weightLb = currentWeight()) {
  const kg = weightLb * 0.4536, cm = s.heightIn * 2.54;
  const bmr = Math.round(10 * kg + 6.25 * cm - 5 * (s.age || 30) + (s.sex === 'female' ? -161 : 5));
  return { bmr, tdee: Math.round(bmr * 1.375), cut: Math.round(bmr * 1.375 - 500) };
}

export function bmi(weightLb = currentWeight(), heightIn = state.settings.heightIn) {
  return +(703 * weightLb / (heightIn * heightIn)).toFixed(1);
}

/* ------------------------------------------------------------------ */
/* Streaks, weeks, next-up                                             */
/* ------------------------------------------------------------------ */
export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
}

export function sessionsThisWeek() {
  const from = startOfWeek().getTime();
  return state.sessions.filter(s => s.startedAt >= from);
}

/** Day-of-week flags for the current week, Monday-first. */
export function weekMap() {
  const from = startOfWeek();
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(from); day.setDate(from.getDate() + i);
    const next = new Date(day);  next.setDate(day.getDate() + 1);
    return {
      label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
      date: day,
      done: state.sessions.some(s => s.startedAt >= day.getTime() && s.startedAt < next.getTime()),
      isToday: todayKey(day) === todayKey(),
    };
  });
}

/** Consecutive weeks with at least 3 sessions. */
export function weekStreak() {
  let streak = 0;
  for (let w = 0; w < 104; w++) {
    const from = startOfWeek(); from.setDate(from.getDate() - 7 * w);
    const to = new Date(from);  to.setDate(from.getDate() + 7);
    const n = state.sessions.filter(s => s.startedAt >= from.getTime() && s.startedAt < to.getTime()).length;
    if (n >= 3) streak++;
    else if (w > 0) break;              // the current week is still in progress
  }
  return streak;
}

/**
 * Next template in the rotation, based on what you did last.
 * Walks past any rotation slot you have deleted, so the suggestion never
 * points at a workout that is no longer in your list.
 */
export function nextUp() {
  const lastRotation = state.sessions.find(s => ROTATION.includes(s.templateId));
  const start = lastRotation ? ROTATION.indexOf(lastRotation.templateId) + 1 : 0;

  for (let i = 0; i < ROTATION.length; i++) {
    const tpl = templateById(ROTATION[(start + i) % ROTATION.length]);
    if (tpl) {
      const lastSame = state.sessions.find(s => s.templateId === tpl.id);
      return { template: tpl, lastDone: lastSame?.startedAt ?? null };
    }
  }
  // Whole rotation deleted — fall back to whatever templates remain.
  const any = allTemplates()[0] ?? null;
  return { template: any, lastDone: null };
}

export function daysSinceLast() {
  if (!state.sessions.length) return null;
  return Math.floor((Date.now() - state.sessions[0].startedAt) / 86400000);
}

/* ------------------------------------------------------------------ */
/* Backup                                                              */
/* ------------------------------------------------------------------ */
export async function exportData() {
  return {
    app: 'ironlog', version: 1, exportedAt: new Date().toISOString(),
    settings: state.settings,
    sessions: state.sessions,
    templates: state.customTemplates,
    exercises: state.customExercises,
    bodyweight: state.bodyweight,
  };
}

export async function importData(json, { replace = false } = {}) {
  if (!json || json.app !== 'ironlog') throw new Error('That file is not an Ironlog backup.');
  if (replace) await db.wipe();

  if (json.settings) await kv.set('settings', { ...DEFAULT_SETTINGS, ...json.settings });
  if (json.sessions?.length)   await db.putAll('sessions', json.sessions);
  if (json.templates?.length)  await db.putAll('templates', json.templates);
  if (json.exercises?.length)  await db.putAll('exercises', json.exercises);
  if (json.bodyweight?.length) await db.putAll('bodyweight', json.bodyweight);

  await loadAll();
  emit();
}

/**
 * Built-in workout templates.
 *
 * Deliberately short. Four or five movements done properly beats ten done in a
 * hurry, and extra sets of a lift you are already doing build more than a new
 * exercise does. Anything cut from here is still in the exercise library —
 * add it mid-workout with "Add exercise", or permanently with "Edit exercises".
 *
 * Block fields:
 *   exerciseId, sets, reps ('8-12' | '12' | 'AMRAP'), rest (sec)
 *   time  — seconds per set, for 'time' exercises
 *   min / incline / speed — for 'cardio' exercises
 *   perSide — reps/time are counted per side
 *   note — one-line intent for this slot in this workout
 */
const b = (exerciseId, o = {}) => ({ exerciseId, sets: 3, rest: 75, ...o });

const START_SLOW = 'Starting out: do 2 sets of each instead of the full number, and add a set each week until you hit it. Finishing a short session beats abandoning a long one.';

export const TEMPLATES = [
  /* ============================ PUSH ============================ */
  {
    id: 'day1_push',
    name: 'Push',
    subtitle: 'Chest, shoulders, triceps + core',
    focus: ['chest', 'shoulders', 'triceps', 'abs'],
    estMin: 45,
    day: 1,
    why: 'Four movements. Push-ups first while you are fresh — that is the calisthenics strength you actually want — then the dumbbell work that makes push-ups easier over time. ' + START_SLOW,
    blocks: [
      b('tm_warmup',      { sets: 1, min: 5, incline: 4, speed: 3.0, rest: 0, note: 'Get warm. Nothing heroic.' }),
      b('pushup',         { sets: 4, reps: 'AMRAP', rest: 90, note: 'Leave 1–2 reps in the tank on the early sets. Last set, go until form breaks. Hands on the bench if you cannot hit 8 on the floor.' }),
      b('db_bench',       { sets: 4, reps: '8-12', rest: 105, note: 'Your main strength lift. Hit 12 clean reps on all 4 sets and go up 5 lb per hand.' }),
      b('db_ohp',         { sets: 3, reps: '10-12', rest: 90 }),
      b('cable_pushdown', { sets: 3, reps: '12-15', rest: 60 }),
      b('plank',          { sets: 3, time: 40, rest: 45, note: 'Add 5 seconds every week.' }),
      b('tm_incline',     { sets: 1, min: 15, incline: 9, speed: 3.0, rest: 0, note: 'Hands off the rails. This is where the fat comes off.' }),
    ],
  },

  /* ============================ LEGS ============================ */
  {
    id: 'day2_lower',
    name: 'Legs',
    subtitle: 'Quads, hamstrings, glutes + cardio',
    focus: ['quads', 'hamstrings', 'glutes', 'cardio'],
    estMin: 45,
    day: 2,
    why: 'A squat, a hinge, one leg at a time, and some core. That covers everything the lower body does. Legs are the biggest muscles you own, so this day burns the most. ' + START_SLOW,
    blocks: [
      b('tm_warmup',    { sets: 1, min: 5, incline: 3, speed: 3.0, rest: 0 }),
      b('goblet_squat', { sets: 4, reps: '10-12', rest: 105, note: 'Main lift. Sit between your heels, chest tall. Do a set with no weight first to groove it.' }),
      b('db_rdl',       { sets: 4, reps: '10', rest: 105, note: 'Hips back, not knees down. Stop at the hamstring stretch, not at the floor.' }),
      b('db_lunge',     { sets: 3, reps: '10', perSide: true, rest: 90, note: 'Step back, not forward — easier on the knees.' }),
      b('leg_raise',    { sets: 3, reps: '12', rest: 45 }),
      b('tm_incline',   { sets: 1, min: 18, incline: 10, speed: 3.0, rest: 0, note: 'Podcast or playlist queued before you start.' }),
    ],
  },

  /* ============================ PULL ============================ */
  {
    id: 'day3_pull',
    name: 'Pull',
    subtitle: 'Back, biceps + obliques',
    focus: ['back', 'biceps', 'obliques'],
    estMin: 42,
    day: 3,
    why: 'One vertical pull, one horizontal pull, arms, core. Pulling balances out all the pushing and fixes forward shoulders. The pulldown is the road to your first pull-up — when you can pull down about 70% of your bodyweight for 8 clean reps, start testing them. ' + START_SLOW,
    blocks: [
      b('tm_warmup',    { sets: 1, min: 5, incline: 4, speed: 3.0, rest: 0 }),
      b('lat_pulldown', { sets: 4, reps: '10-12', rest: 105, note: 'Main lift. Elbows down and back, no leaning away from the bar.' }),
      b('cable_row',    { sets: 4, reps: '10-12', rest: 105, note: 'No rocking. Squeeze the shoulder blades for a full second.' }),
      b('db_hammer',    { sets: 3, reps: '12', rest: 60, note: '2-second lower on every rep — that is where the growth is.' }),
      b('side_plank',   { sets: 3, time: 30, perSide: true, rest: 45 }),
      b('tm_incline',   { sets: 1, min: 15, incline: 9, speed: 3.0, rest: 0 }),
    ],
  },

  /* ==================== CALISTHENICS CIRCUIT ==================== */
  {
    id: 'day4_calisthenics',
    name: 'Calisthenics Circuit',
    subtitle: 'Full body, minimal rest',
    focus: ['fullbody', 'abs', 'cardio'],
    estMin: 40,
    day: 4,
    why: 'Four bodyweight moves, back to back, four rounds. Push, squat, pull, brace — that is the whole body. Heart rate stays up the whole time, so it burns like cardio and builds like lifting. Two rounds is a real workout if four is too much today.',
    blocks: [
      b('tm_warmup',    { sets: 1, min: 5, incline: 3, speed: 3.2, rest: 0 }),
      b('pushup',       { sets: 4, reps: '10-15', rest: 15, note: 'CIRCUIT 1/4 — straight into squats.' }),
      b('bw_squat',     { sets: 4, reps: '20', rest: 15, note: 'CIRCUIT 2/4' }),
      b('inverted_row', { sets: 4, reps: '10-12', rest: 15, note: 'CIRCUIT 3/4 — no bar? Lat pulldown instead, same reps.' }),
      b('plank',        { sets: 4, time: 45, rest: 90, note: 'CIRCUIT 4/4 — rest 90s, then go again from the top.' }),
      b('tm_incline',   { sets: 1, min: 18, incline: 8, speed: 3.2, rest: 0 }),
    ],
  },

  /* ========================= CARDIO + CORE ========================= */
  {
    id: 'cardio_core',
    name: 'Cardio + Core',
    subtitle: 'Intervals and abs · 35 min',
    focus: ['cardio', 'abs', 'obliques'],
    estMin: 35,
    standalone: true,
    why: 'A full day that is not a lifting day. Intervals push conditioning harder than steady walking without beating up your joints. Good as a fifth day, or swap it in when a lifting day is not happening.',
    blocks: [
      b('tm_warmup',    { sets: 1, min: 5, incline: 3, speed: 3.0, rest: 0 }),
      b('tm_intervals', { sets: 1, min: 18, incline: 10, speed: 3.4, rest: 0,
                          note: '1 minute steep climb, 2 minutes easy, six rounds. Log the average — the app cannot see the up and down.' }),
      b('side_plank',   { sets: 3, time: 35, perSide: true, rest: 45 }),
      b('hollow_hold',  { sets: 3, time: 25, rest: 45, note: 'Bend the knees to scale it.' }),
      b('tm_cooldown',  { sets: 1, min: 4, incline: 0, speed: 2.5, rest: 0 }),
    ],
  },

  /* ======================= STANDALONE CARDIO ======================= */
  {
    id: 'cardio_incline',
    name: 'Incline Burn',
    subtitle: 'Treadmill only · 35 min',
    focus: ['cardio'],
    estMin: 35,
    standalone: true,
    why: 'Your off-day option. Low impact, easy to recover from, and you can do it every day without interfering with lifting. Walking uphill at a conversational pace is the most sustainable fat-loss work there is.',
    blocks: [
      b('tm_warmup',   { sets: 1, min: 5,  incline: 2,  speed: 3.0, rest: 0 }),
      b('tm_incline',  { sets: 1, min: 25, incline: 10, speed: 3.0, rest: 0,
                         note: 'Steady. If you can sing, raise the incline. If you cannot talk at all, drop it.' }),
      b('tm_cooldown', { sets: 1, min: 5,  incline: 0,  speed: 2.5, rest: 0 }),
      b('calf_stretch',{ sets: 1, time: 30, perSide: true, rest: 0 }),
    ],
  },

  /* ======================= MOBILITY / RECOVERY ======================= */
  {
    id: 'mobility',
    name: 'Mobility & Stretch',
    subtitle: 'Recovery day · 12 min',
    focus: ['mobility'],
    estMin: 12,
    standalone: true,
    why: 'Twelve minutes on a rest day pays for itself: less stiffness, better squat depth, fewer aches. Hold each position and breathe — do not bounce.',
    blocks: [
      b('cat_cow',           { sets: 1, time: 60, rest: 0 }),
      b('worlds_greatest',   { sets: 1, time: 45, perSide: true, rest: 0 }),
      b('hipflexor_stretch', { sets: 1, time: 45, perSide: true, rest: 0 }),
      b('pigeon',            { sets: 1, time: 60, perSide: true, rest: 0 }),
      b('hamstring_stretch', { sets: 1, time: 45, perSide: true, rest: 0 }),
      b('doorway_chest',     { sets: 1, time: 40, perSide: true, rest: 0 }),
      b('child_pose',        { sets: 1, time: 60, rest: 0 }),
    ],
  },
];

/** The 4-day strength rotation, in order. */
export const ROTATION = ['day1_push', 'day2_lower', 'day3_pull', 'day4_calisthenics'];

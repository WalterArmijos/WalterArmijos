/**
 * Built-in workout templates.
 *
 * Block fields:
 *   exerciseId, sets, reps ('8-12' | '12' | 'AMRAP'), rest (sec)
 *   time  — seconds per set, for 'time' exercises
 *   min / incline / speed — for 'cardio' exercises
 *   perSide — reps/time are counted per side
 *   note — one-line intent for this slot in this workout
 */
const b = (exerciseId, o = {}) => ({ exerciseId, sets: 3, rest: 75, ...o });

export const TEMPLATES = [
  /* ============================ DAY 1 ============================ */
  {
    id: 'day1_push',
    name: 'Push',
    subtitle: 'Chest, shoulders, triceps + core',
    focus: ['chest', 'shoulders', 'triceps', 'abs'],
    estMin: 55,
    day: 1,
    why: 'Push-ups first while you are fresh — that is the calisthenics strength you actually want. Dumbbell work after adds the load that makes push-ups easier over time. Finishes on the treadmill while glycogen is already low, which is the best time to walk.',
    blocks: [
      b('tm_warmup',      { sets: 1, min: 5,  incline: 4, speed: 3.0, rest: 0,  note: 'Get warm. Nothing heroic.' }),
      b('pushup',         { sets: 4, reps: 'AMRAP', rest: 90, note: 'Leave 1–2 reps in the tank on the first three sets. Last set, go to technical failure — stop when form breaks, not when it hurts.' }),
      b('db_bench',       { sets: 4, reps: '8-12', rest: 105, note: 'Your main strength lift. When you hit 12 clean reps on all 4 sets, go up 5 lb per hand.' }),
      b('db_incline',     { sets: 3, reps: '10-12', rest: 90 }),
      b('db_ohp',         { sets: 3, reps: '10-12', rest: 90 }),
      b('db_lateral',     { sets: 3, reps: '12-15', rest: 60, note: 'Light. Burn, not weight.' }),
      b('cable_pushdown', { sets: 3, reps: '12-15', rest: 60 }),
      b('plank',          { sets: 3, time: 40, rest: 45, note: 'Add 5 seconds every week.' }),
      b('cable_woodchop', { sets: 3, reps: '12', perSide: true, rest: 45 }),
      b('tm_incline',     { sets: 1, min: 15, incline: 9, speed: 3.0, rest: 0, note: 'Hands off the rails. This is where the fat comes off.' }),
      b('doorway_chest',  { sets: 1, time: 30, perSide: true, rest: 0 }),
      b('child_pose',     { sets: 1, time: 45, rest: 0 }),
    ],
  },

  /* ============================ DAY 2 ============================ */
  {
    id: 'day2_lower',
    name: 'Legs',
    subtitle: 'Quads, hamstrings, glutes + long cardio',
    focus: ['quads', 'hamstrings', 'glutes', 'cardio'],
    estMin: 55,
    day: 2,
    why: 'Legs are the biggest muscles you own, so leg day burns the most and does the most for your metabolism. The longer incline walk lives here because your upper body is fresh for tomorrow either way.',
    blocks: [
      b('tm_warmup',    { sets: 1, min: 5, incline: 3, speed: 3.0, rest: 0 }),
      b('bw_squat',     { sets: 2, reps: '15', rest: 45, note: 'Warm-up sets. Groove the pattern before you add weight.' }),
      b('goblet_squat', { sets: 4, reps: '10-12', rest: 105, note: 'Main lift. Sit between your heels, chest tall.' }),
      b('db_rdl',       { sets: 4, reps: '10', rest: 105, note: 'Hips back, not knees down. Feel it in the hamstrings.' }),
      b('db_lunge',     { sets: 3, reps: '10', perSide: true, rest: 90 }),
      b('db_stepup',    { sets: 3, reps: '10', perSide: true, rest: 75 }),
      b('db_calf',      { sets: 3, reps: '15-20', rest: 45 }),
      b('leg_raise',    { sets: 3, reps: '12', rest: 45 }),
      b('tm_incline',   { sets: 1, min: 20, incline: 10, speed: 3.0, rest: 0, note: 'The big one. 20 minutes, steep, steady. Podcast or playlist ready before you start.' }),
      b('hipflexor_stretch', { sets: 1, time: 40, perSide: true, rest: 0 }),
      b('hamstring_stretch', { sets: 1, time: 40, perSide: true, rest: 0 }),
      b('calf_stretch',      { sets: 1, time: 30, perSide: true, rest: 0 }),
    ],
  },

  /* ============================ DAY 3 ============================ */
  {
    id: 'day3_pull',
    name: 'Pull',
    subtitle: 'Back, biceps, rear delts + obliques',
    focus: ['back', 'biceps', 'obliques'],
    estMin: 55,
    day: 3,
    why: 'Pulling balances out all the pushing and fixes the forward shoulder posture. The pulldown is the direct road to your first pull-up — when you can pull down ~70% of your bodyweight for 8 clean reps, start testing pull-ups.',
    blocks: [
      b('tm_warmup',      { sets: 1, min: 5, incline: 4, speed: 3.0, rest: 0 }),
      b('lat_pulldown',   { sets: 4, reps: '10-12', rest: 105, note: 'Main lift. Elbows down and back, no leaning away.' }),
      b('cable_row',      { sets: 4, reps: '10-12', rest: 105 }),
      b('db_row',         { sets: 3, reps: '10', perSide: true, rest: 90 }),
      b('cable_facepull', { sets: 3, reps: '15', rest: 60, note: 'Posture insurance. Never skip it.' }),
      b('db_hammer',      { sets: 3, reps: '12', rest: 60 }),
      b('db_curl',        { sets: 3, reps: '12', rest: 60, note: '2-second lower on every rep.' }),
      b('side_plank',     { sets: 3, time: 30, perSide: true, rest: 45 }),
      b('russian_twist',  { sets: 3, reps: '20', rest: 45 }),
      b('tm_incline',     { sets: 1, min: 15, incline: 9, speed: 3.0, rest: 0 }),
      b('thoracic_rotation', { sets: 1, time: 40, perSide: true, rest: 0 }),
      b('child_pose',        { sets: 1, time: 45, rest: 0 }),
    ],
  },

  /* ============================ DAY 4 ============================ */
  {
    id: 'day4_calisthenics',
    name: 'Calisthenics Circuit',
    subtitle: 'Full body, minimal rest, core-heavy',
    focus: ['fullbody', 'abs', 'obliques', 'cardio'],
    estMin: 50,
    day: 4,
    why: 'Pure bodyweight, short rests, heart rate up the whole time. This is the day that builds real-world strength and burns the most per minute. Move through the five circuit moves back to back, rest 90 seconds, repeat four times.',
    blocks: [
      b('tm_warmup',        { sets: 1, min: 5, incline: 3, speed: 3.2, rest: 0 }),
      b('pushup',           { sets: 4, reps: '10-15', rest: 15, note: 'CIRCUIT 1/5 — move straight to squats.' }),
      b('bw_squat',         { sets: 4, reps: '20', rest: 15, note: 'CIRCUIT 2/5' }),
      b('inverted_row',     { sets: 4, reps: '10-12', rest: 15, note: 'CIRCUIT 3/5 — no bar? Swap in a lat pulldown, same reps.' }),
      b('mountain_climber', { sets: 4, time: 30, rest: 15, note: 'CIRCUIT 4/5' }),
      b('plank',            { sets: 4, time: 45, rest: 90, note: 'CIRCUIT 5/5 — then rest 90s and go again.' }),
      b('bicycle_crunch',   { sets: 3, reps: '20', rest: 45 }),
      b('dead_bug',         { sets: 3, reps: '10', perSide: true, rest: 45 }),
      b('hollow_hold',      { sets: 3, time: 25, rest: 45, note: 'Hardest core hold here. Bend the knees to scale it.' }),
      b('suitcase_carry',   { sets: 2, time: 40, perSide: true, rest: 60 }),
      b('tm_incline',       { sets: 1, min: 20, incline: 8, speed: 3.2, rest: 0 }),
      b('worlds_greatest',  { sets: 1, time: 40, perSide: true, rest: 0 }),
      b('pigeon',           { sets: 1, time: 45, perSide: true, rest: 0 }),
    ],
  },

  /* ======================= STANDALONE CARDIO ======================= */
  {
    id: 'cardio_incline',
    name: 'Incline Burn',
    subtitle: 'Treadmill only · 30–40 min',
    focus: ['cardio'],
    estMin: 35,
    standalone: true,
    why: 'Your off-day and rest-day option. Low impact, easy to recover from, and you can do it every single day without interfering with your lifting. Walking uphill at a conversational pace is the most sustainable fat-loss work there is.',
    blocks: [
      b('tm_warmup',   { sets: 1, min: 5,  incline: 2,  speed: 3.0, rest: 0 }),
      b('tm_incline',  { sets: 1, min: 25, incline: 10, speed: 3.0, rest: 0, note: 'Steady state. If you can sing, raise the incline. If you can\'t talk at all, drop it.' }),
      b('tm_cooldown', { sets: 1, min: 5,  incline: 0,  speed: 2.5, rest: 0 }),
      b('calf_stretch',{ sets: 1, time: 30, perSide: true, rest: 0 }),
      b('hipflexor_stretch', { sets: 1, time: 40, perSide: true, rest: 0 }),
    ],
  },

  /* ========================= CARDIO + CORE ========================= */
  {
    id: 'cardio_core',
    name: 'Cardio + Core',
    subtitle: 'Intervals, carries and abs · 40 min',
    focus: ['cardio', 'abs', 'obliques'],
    estMin: 40,
    standalone: true,
    why: 'A full day that is not a lifting day. Intervals push your conditioning harder than steady walking without beating up your joints, and the core work afterwards is the part most people skip. Good as a fifth day, or swap it in whenever a lifting day is not happening.',
    blocks: [
      b('tm_warmup',        { sets: 1, min: 5, incline: 3, speed: 3.0, rest: 0 }),
      b('tm_intervals',     { sets: 1, min: 18, incline: 10, speed: 3.4, rest: 0,
                              note: '1 minute steep climb, 2 minutes easy, six rounds. Log the average incline and speed — the app cannot see the up and down.' }),
      b('tm_cooldown',      { sets: 1, min: 4, incline: 0, speed: 2.5, rest: 0 }),
      b('side_plank',       { sets: 3, time: 35, perSide: true, rest: 45 }),
      b('cable_pallof',     { sets: 3, reps: '12', perSide: true, rest: 45 }),
      b('bicycle_crunch',   { sets: 3, reps: '20', rest: 45 }),
      b('hollow_hold',      { sets: 3, time: 25, rest: 45 }),
      b('suitcase_carry',   { sets: 3, time: 40, perSide: true, rest: 60,
                              note: 'Heaviest dumbbell you can walk tall with.' }),
      b('bird_dog',         { sets: 2, reps: '10', perSide: true, rest: 30 }),
      b('child_pose',       { sets: 1, time: 45, rest: 0 }),
      b('hipflexor_stretch',{ sets: 1, time: 40, perSide: true, rest: 0 }),
    ],
  },

  /* ======================= MOBILITY / RECOVERY ======================= */
  {
    id: 'mobility',
    name: 'Mobility & Stretch',
    subtitle: 'Recovery day · 15 min',
    focus: ['mobility'],
    estMin: 15,
    standalone: true,
    why: 'Fifteen minutes on a rest day pays for itself: less stiffness, better squat depth, fewer aches. Hold each position and breathe — do not bounce.',
    blocks: [
      b('cat_cow',           { sets: 1, time: 60, rest: 0 }),
      b('worlds_greatest',   { sets: 1, time: 45, perSide: true, rest: 0 }),
      b('hipflexor_stretch', { sets: 1, time: 45, perSide: true, rest: 0 }),
      b('pigeon',            { sets: 1, time: 60, perSide: true, rest: 0 }),
      b('hamstring_stretch', { sets: 1, time: 45, perSide: true, rest: 0 }),
      b('thoracic_rotation', { sets: 1, time: 45, perSide: true, rest: 0 }),
      b('doorway_chest',     { sets: 1, time: 40, perSide: true, rest: 0 }),
      b('calf_stretch',      { sets: 1, time: 40, perSide: true, rest: 0 }),
      b('couch_stretch',     { sets: 1, time: 30, perSide: true, rest: 0 }),
      b('child_pose',        { sets: 1, time: 60, rest: 0 }),
    ],
  },
];

/** The 4-day strength rotation, in order. */
export const ROTATION = ['day1_push', 'day2_lower', 'day3_pull', 'day4_calisthenics'];

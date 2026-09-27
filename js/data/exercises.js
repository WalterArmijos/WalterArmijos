/**
 * Exercise library.
 *
 * type:
 *   'weight_reps' — load + reps (dumbbells, cables, machines)
 *   'reps'        — bodyweight reps, optional added load
 *   'time'        — held or timed (planks, stretches, carries)
 *   'cardio'      — treadmill: minutes, incline %, speed mph
 *
 * Every entry is doable with: treadmill, dumbbells, adjustable bench,
 * cable stack / lat pulldown, and the floor.
 */
export const MUSCLES = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes',
  calves: 'Calves', abs: 'Abs', obliques: 'Obliques', lowerback: 'Lower back',
  hipflexors: 'Hip flexors', fullbody: 'Full body', cardio: 'Cardio', mobility: 'Mobility',
};

const ex = (id, name, type, primary, secondary, equipment, cue, tags = []) =>
  ({ id, name, type, primary, secondary, equipment, cue, tags });

export const EXERCISES = [
  /* ---------------- Treadmill / cardio ---------------- */
  ex('tm_warmup', 'Treadmill Warm-Up Walk', 'cardio', ['cardio'], [], ['treadmill'],
     'Easy pace, light incline. You should be able to hold a conversation. This is to raise body temp, not to burn out.', ['warmup']),
  ex('tm_incline', 'Incline Walk', 'cardio', ['cardio'], ['glutes','calves'], ['treadmill'],
     'The single best fat-loss tool you have. Hands OFF the rails — holding on cuts the work by ~25%. Keep heart rate where you can still speak in short sentences.', ['finisher','fatloss']),
  ex('tm_intervals', 'Incline Intervals', 'cardio', ['cardio'], ['quads','glutes'], ['treadmill'],
     'Alternate 1 min hard climb / 2 min easy. Log the average incline and speed.', ['fatloss']),
  ex('tm_cooldown', 'Cool-Down Walk', 'cardio', ['cardio'], [], ['treadmill'],
     'Flat, slow. Let your heart rate drift back down before you stop.', ['cooldown']),

  /* ---------------- Calisthenics: push ---------------- */
  ex('pushup', 'Push-Up', 'reps', ['chest'], ['triceps','shoulders','abs'], ['bodyweight'],
     'Hands under shoulders, body one straight line, elbows ~45° from your ribs. Full lockout at the top. If you fail before 8 reps, do them with hands on the bench.', ['calisthenics','key']),
  ex('pushup_incline', 'Incline Push-Up (hands on bench)', 'reps', ['chest'], ['triceps','shoulders'], ['bench'],
     'The scaled version. The higher the hands, the easier it is. Work here until you can do 3×12 clean, then move to the floor.', ['calisthenics','regression']),
  ex('pushup_deficit', 'Deficit Push-Up (hands on dumbbells)', 'reps', ['chest'], ['triceps','shoulders'], ['dumbbells'],
     'Grip two dumbbells so you can drop your chest below your hands. More range, more chest.', ['calisthenics','progression']),
  ex('pushup_diamond', 'Diamond Push-Up', 'reps', ['triceps'], ['chest'], ['bodyweight'],
     'Hands together under your sternum. Elbows tight to your sides. This is the triceps version.', ['calisthenics']),
  ex('pike_pushup', 'Pike Push-Up', 'reps', ['shoulders'], ['triceps'], ['bodyweight'],
     'Hips high, head aims for the floor between your hands. Your bodyweight overhead press.', ['calisthenics']),
  ex('dip_bench', 'Bench Dip', 'reps', ['triceps'], ['chest','shoulders'], ['bench'],
     'Hands on the bench behind you, elbows straight back. Stop if your shoulders pinch.', ['calisthenics']),

  /* ---------------- Dumbbell: push ---------------- */
  ex('db_bench', 'Dumbbell Bench Press', 'weight_reps', ['chest'], ['triceps','shoulders'], ['dumbbells','bench'],
     'Lower until your elbows are level with your torso. Drive the dumbbells up and slightly together. Control the way down — 2 seconds.', ['key']),
  ex('db_incline', 'Incline Dumbbell Press', 'weight_reps', ['chest'], ['shoulders','triceps'], ['dumbbells','bench'],
     'Bench at 30°. Higher than that and it becomes a shoulder press.'),
  ex('db_fly', 'Dumbbell Fly', 'weight_reps', ['chest'], [], ['dumbbells','bench'],
     'Soft elbows, wide arc, hug a barrel. Light weight — this is a stretch exercise, not a strength one.'),
  ex('db_ohp', 'Seated Dumbbell Shoulder Press', 'weight_reps', ['shoulders'], ['triceps'], ['dumbbells','bench'],
     'Back against an upright bench, ribs down. Press until your arms are straight without shrugging.', ['key']),
  ex('db_lateral', 'Dumbbell Lateral Raise', 'weight_reps', ['shoulders'], [], ['dumbbells'],
     'Lead with your elbows, stop at shoulder height. Lighter than your ego wants — 10–20 lb is plenty.'),
  ex('db_front_raise', 'Dumbbell Front Raise', 'weight_reps', ['shoulders'], [], ['dumbbells'],
     'Raise to eye level, no swinging from the hips.'),
  ex('db_skullcrusher', 'Dumbbell Skullcrusher', 'weight_reps', ['triceps'], [], ['dumbbells','bench'],
     'Upper arms stay vertical and still. Only the forearms move.'),
  ex('db_oh_tricep', 'Overhead Dumbbell Triceps Extension', 'weight_reps', ['triceps'], [], ['dumbbells'],
     'One heavy dumbbell, both hands. Elbows point forward, deep stretch at the bottom.'),

  /* ---------------- Cable / machine: pull ---------------- */
  ex('lat_pulldown', 'Lat Pulldown', 'weight_reps', ['back'], ['biceps'], ['cable'],
     'Chest tall, pull the bar to your collarbone, drive your elbows down and back. This is your pull-up builder — get strong here and pull-ups become realistic.', ['key']),
  ex('lat_pulldown_close', 'Close-Grip Pulldown', 'weight_reps', ['back'], ['biceps'], ['cable'],
     'Neutral or narrow grip. Hits the lower lats and gives the biceps more work.'),
  ex('cable_row', 'Seated Cable Row', 'weight_reps', ['back'], ['biceps'], ['cable'],
     'Don\'t rock. Pull to your belly button, squeeze the shoulder blades for a full second, control the return.', ['key']),
  ex('cable_facepull', 'Cable Face Pull', 'weight_reps', ['shoulders'], ['back'], ['cable'],
     'Rope to your forehead, elbows high, finish in a double biceps pose. The best 3 minutes you can spend on shoulder health and posture.'),
  ex('cable_pushdown', 'Cable Triceps Pushdown', 'weight_reps', ['triceps'], [], ['cable'],
     'Elbows pinned to your sides. Only your forearms move. Full lockout, squeeze.'),
  ex('cable_curl', 'Cable Biceps Curl', 'weight_reps', ['biceps'], [], ['cable'],
     'Constant tension the whole way — the reason to use a cable over a dumbbell here.'),
  ex('cable_woodchop', 'Cable Woodchopper', 'weight_reps', ['obliques'], ['abs'], ['cable'],
     'High to low, across the body. Rotate from the ribs, not the arms. Log reps PER SIDE.', ['obliques','key']),
  ex('cable_pallof', 'Cable Pallof Press', 'weight_reps', ['obliques'], ['abs'], ['cable'],
     'Stand side-on, press the handle straight out and resist the twist. Nothing moves. Log reps per side.', ['obliques']),
  ex('cable_row_single', 'Single-Arm Cable Row', 'weight_reps', ['back'], ['biceps','obliques'], ['cable'],
     'One side at a time so the strong side can\'t cover for the weak one.'),
  ex('cable_kickback', 'Cable Glute Kickback', 'weight_reps', ['glutes'], ['hamstrings'], ['cable'],
     'Slow and deliberate, squeeze at the top. Log reps per side.'),

  /* ---------------- Dumbbell: pull & arms ---------------- */
  ex('db_row', 'Single-Arm Dumbbell Row', 'weight_reps', ['back'], ['biceps'], ['dumbbells','bench'],
     'Knee and hand on the bench, flat back. Pull the dumbbell to your hip, not your shoulder. Log reps per side.', ['key']),
  ex('db_row_bent', 'Bent-Over Dumbbell Row', 'weight_reps', ['back'], ['biceps'], ['dumbbells'],
     'Hinge to ~45°, back flat. Both dumbbells, elbows past your ribs.'),
  ex('db_curl', 'Dumbbell Curl', 'weight_reps', ['biceps'], [], ['dumbbells'],
     'No swinging. Lower for 2 full seconds — that\'s where the growth is.'),
  ex('db_hammer', 'Hammer Curl', 'weight_reps', ['biceps'], ['shoulders'], ['dumbbells'],
     'Palms face each other. Builds the forearm and the thickness of the arm.'),
  ex('db_shrug', 'Dumbbell Shrug', 'weight_reps', ['back'], ['shoulders'], ['dumbbells'],
     'Straight up, pause a beat at the top. No rolling.'),
  ex('db_rev_fly', 'Bent-Over Reverse Fly', 'weight_reps', ['shoulders'], ['back'], ['dumbbells'],
     'Light. Think about pulling your shoulder blades apart, then together.'),
  ex('db_pullover', 'Dumbbell Pullover', 'weight_reps', ['back'], ['chest'], ['dumbbells','bench'],
     'One dumbbell, lie across or along the bench, big stretch overhead.'),

  /* ---------------- Legs ---------------- */
  ex('bw_squat', 'Bodyweight Squat', 'reps', ['quads'], ['glutes','hamstrings'], ['bodyweight'],
     'Feet shoulder width, sit back and down, chest up, knees track over the toes. Go as deep as you can keep a flat back.', ['calisthenics']),
  ex('goblet_squat', 'Goblet Squat', 'weight_reps', ['quads'], ['glutes','abs'], ['dumbbells'],
     'One dumbbell at your chest. The load in front keeps you upright — the most back-friendly squat there is.', ['key']),
  ex('db_rdl', 'Dumbbell Romanian Deadlift', 'weight_reps', ['hamstrings'], ['glutes','lowerback'], ['dumbbells'],
     'Push your hips BACK, soft knees, dumbbells dragging down your thighs. Stop when you feel the hamstring stretch — not when the weights hit the floor.', ['key']),
  ex('db_lunge', 'Dumbbell Reverse Lunge', 'weight_reps', ['quads'], ['glutes','hamstrings'], ['dumbbells'],
     'Step BACK, not forward — much easier on the knees. Log reps per leg.', ['key']),
  ex('db_stepup', 'Dumbbell Step-Up', 'weight_reps', ['quads'], ['glutes'], ['dumbbells','bench'],
     'Drive through the heel of the top foot. Don\'t push off the bottom leg. Reps per leg.'),
  ex('db_split_squat', 'Bulgarian Split Squat', 'weight_reps', ['quads'], ['glutes'], ['dumbbells','bench'],
     'Rear foot on the bench. Brutal but it builds single-leg strength fast. Reps per leg.'),
  ex('db_calf', 'Dumbbell Calf Raise', 'weight_reps', ['calves'], [], ['dumbbells'],
     'Full stretch at the bottom, pause at the top. High reps.'),
  ex('glute_bridge', 'Glute Bridge / Hip Thrust', 'weight_reps', ['glutes'], ['hamstrings'], ['bench','dumbbells'],
     'Shoulders on the bench, dumbbell across the hips, squeeze hard at the top and keep the ribs down.'),
  ex('wall_sit', 'Wall Sit', 'time', ['quads'], ['glutes'], ['bodyweight'],
     'Thighs parallel to the floor, back flat on the wall. Breathe.', ['calisthenics']),

  /* ---------------- Core & obliques ---------------- */
  ex('plank', 'Plank', 'time', ['abs'], ['obliques','shoulders'], ['bodyweight'],
     'Elbows under shoulders, squeeze the glutes, tuck the ribs down. If your lower back sags, the set is over.', ['calisthenics','key']),
  ex('side_plank', 'Side Plank', 'time', ['obliques'], ['abs'], ['bodyweight'],
     'Stack the feet, push the hip to the ceiling, straight line ear to ankle. Log time PER SIDE.', ['obliques','key']),
  ex('dead_bug', 'Dead Bug', 'reps', ['abs'], ['hipflexors'], ['bodyweight'],
     'Lower back glued to the floor the entire time. Opposite arm and leg, slow. Reps per side.', ['calisthenics']),
  ex('bicycle_crunch', 'Bicycle Crunch', 'reps', ['obliques'], ['abs'], ['bodyweight'],
     'Slow. Bring the shoulder to the knee, not the elbow. Count both sides as one rep.', ['obliques']),
  ex('russian_twist', 'Russian Twist', 'reps', ['obliques'], ['abs'], ['dumbbells'],
     'Lean back to ~45°, chest tall, rotate the ribcage and touch the floor either side. Count each side.', ['obliques']),
  ex('leg_raise', 'Lying Leg Raise', 'reps', ['abs'], ['hipflexors'], ['bodyweight'],
     'Hands under your tailbone, lower until just before your back arches, then come back up.', ['calisthenics']),
  ex('mountain_climber', 'Mountain Climbers', 'time', ['abs'], ['cardio','hipflexors'], ['bodyweight'],
     'Plank position, drive the knees. Hips stay low and still.', ['calisthenics']),
  ex('hollow_hold', 'Hollow Body Hold', 'time', ['abs'], [], ['bodyweight'],
     'Lower back pressed flat, arms and legs off the floor. The foundation of every calisthenics core skill.', ['calisthenics']),
  ex('bird_dog', 'Bird Dog', 'reps', ['lowerback'], ['abs','glutes'], ['bodyweight'],
     'Opposite arm and leg, long and slow. Don\'t let the hips tilt. Reps per side.'),
  ex('flutter_kick', 'Flutter Kicks', 'time', ['abs'], ['hipflexors'], ['bodyweight'],
     'Small, fast, controlled. Low back stays down.'),
  ex('db_side_bend', 'Dumbbell Side Bend', 'weight_reps', ['obliques'], [], ['dumbbells'],
     'One dumbbell, bend straight sideways — no twisting or leaning forward. Reps per side.', ['obliques']),
  ex('suitcase_carry', 'Suitcase Carry', 'time', ['obliques'], ['back','fullbody'], ['dumbbells'],
     'One heavy dumbbell, walk tall and DON\'T lean. Your obliques fight the whole way. Time per side.', ['obliques']),

  /* ---------------- Full body / conditioning ---------------- */
  ex('burpee', 'Burpee', 'reps', ['fullbody'], ['cardio','chest','quads'], ['bodyweight'],
     'Pace yourself. Step back instead of jumping back if the knees complain.', ['calisthenics']),
  ex('db_thruster', 'Dumbbell Thruster', 'weight_reps', ['fullbody'], ['quads','shoulders'], ['dumbbells'],
     'Squat, then ride the momentum into an overhead press. One fluid movement.'),
  ex('db_swing', 'Dumbbell Swing', 'weight_reps', ['glutes'], ['hamstrings','cardio'], ['dumbbells'],
     'Hip snap, not a squat. The arms are just rope. Great conditioning finisher.'),
  ex('inverted_row', 'Inverted Row (bar or Smith)', 'reps', ['back'], ['biceps'], ['bodyweight'],
     'Set a bar at hip height, body straight, pull your chest to the bar. The horizontal pull-up. Skip to the pulldown if there\'s no bar.', ['calisthenics']),
  ex('step_up_bw', 'Bodyweight Step-Up', 'reps', ['quads'], ['glutes','cardio'], ['bench'],
     'Controlled up and down. Reps per leg.', ['calisthenics']),

  /* ---------------- Mobility & stretching ---------------- */
  ex('cat_cow', 'Cat-Cow', 'time', ['mobility'], ['lowerback'], ['bodyweight'],
     'On all fours, arch and round the spine with your breath. Wakes the whole back up.', ['mobility']),
  ex('worlds_greatest', "World's Greatest Stretch", 'time', ['mobility'], ['hipflexors'], ['bodyweight'],
     'Deep lunge, elbow to the inside of the front foot, then rotate and reach up. Time per side. Earns its name.', ['mobility']),
  ex('hipflexor_stretch', 'Kneeling Hip Flexor Stretch', 'time', ['mobility'], ['hipflexors'], ['bodyweight'],
     'Half-kneeling, squeeze the back glute and push the hip forward. Per side. Essential if you sit a lot.', ['mobility']),
  ex('hamstring_stretch', 'Standing Hamstring Stretch', 'time', ['mobility'], ['hamstrings'], ['bodyweight'],
     'Heel on the bench, hinge from the hip with a flat back. Per side.', ['mobility']),
  ex('pigeon', 'Pigeon Pose', 'time', ['mobility'], ['glutes'], ['bodyweight'],
     'Front shin across, sink the hips. Per side. Opens up everything the treadmill tightens.', ['mobility']),
  ex('thoracic_rotation', 'Thoracic Rotation (open book)', 'time', ['mobility'], ['obliques'], ['bodyweight'],
     'Side-lying, knees stacked, open the top arm across and follow it with your eyes. Per side.', ['mobility']),
  ex('doorway_chest', 'Doorway Chest Stretch', 'time', ['mobility'], ['chest'], ['bodyweight'],
     'Forearm on the frame at 90°, step through and turn away. Per side.', ['mobility']),
  ex('child_pose', "Child's Pose", 'time', ['mobility'], ['lowerback'], ['bodyweight'],
     'Knees wide, hips to heels, reach long. Breathe into the lower back.', ['mobility']),
  ex('calf_stretch', 'Calf Stretch', 'time', ['mobility'], ['calves'], ['bodyweight'],
     'Back heel down, back leg straight. Per side. Incline walking will make you need this.', ['mobility']),
  ex('couch_stretch', 'Neck & Upper Trap Stretch', 'time', ['mobility'], ['shoulders'], ['bodyweight'],
     'Ear toward the shoulder, gentle hand assist. Per side. Never force it.', ['mobility']),
];

export const EX_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

export function getExercise(id, custom = []) {
  return EX_BY_ID[id] || custom.find(e => e.id === id) || null;
}

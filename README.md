# Ironlog

A personal workout tracker — built for one gym, one person. Strength, calisthenics,
core work and incline walking, logged set by set on your own phone.

No account, no server, no subscription. Everything is stored in your browser's
database on the device you use it on.

---

## What it does

- **Six templates** built around a treadmill, dumbbells, an adjustable bench and a
  cable/lat-pulldown stack — a 4-day strength rotation plus a standalone cardio day
  and a mobility day.
- **Live workout logging.** Weight × reps, bodyweight reps, timed holds and treadmill
  blocks each get their own input row. Your last session's numbers sit next to every
  set so you always know what to beat.
- **Rest timer** that starts itself when you check off a set, with a chime, a vibrate
  and ±15s buttons. A separate countdown for planks and other holds ticks down and
  checks the set off for you.
- **Tweak anything mid-workout** — add or drop sets, add an exercise, swap one out when
  a machine is taken, reorder, leave a note.
- **Personal-record detection.** Beat your best set on an exercise and it says so.
- **Progress.** Body-weight trend against your goal, workouts and treadmill minutes per
  week, where your sets actually went by muscle group, and an estimated-1RM chart per lift.
- **Light and dark mode**, and it installs to your home screen and runs offline.

## Using it on your phone

1. Open the app's URL in Safari (iPhone) or Chrome (Android).
2. **iPhone:** Share → *Add to Home Screen*. **Android:** menu → *Install app*.
3. Open it from the home-screen icon. It runs full-screen and works with no signal.

## Running it

It is a static site — no build step, no dependencies. Any static host works:

```bash
# locally
npx http-server -p 8080 .
# then open http://localhost:8080
```

To put it on your phone permanently, host it somewhere with HTTPS. The simplest free
option is **GitHub Pages**: repo *Settings → Pages → Source: Deploy from a branch*,
pick this branch and the root folder. The URL it gives you is the one you install from.

> It must be served over `http://` or `https://` — opening `index.html` straight off the
> filesystem will not work, because browsers block JavaScript modules and the offline
> service worker on `file://` URLs.

## Your data

Everything lives in IndexedDB on that one device. Nothing is uploaded anywhere.

The trade-off: **clearing your browser data deletes your history.** Use
*Settings → Export backup* now and then — it downloads a single JSON file you can
restore from on any device, which is also how you'd move to a new phone.

## The program

Four sessions a week, roughly 50–55 minutes each including the treadmill:

| Day | Focus | Main lifts |
|-----|-------|-----------|
| 1 | Push — chest, shoulders, triceps, core | Push-ups, DB bench, DB shoulder press |
| 2 | Legs — quads, hamstrings, glutes | Goblet squat, DB Romanian deadlift, lunges |
| 3 | Pull — back, biceps, obliques | Lat pulldown, cable row, single-arm row |
| 4 | Full-body calisthenics circuit | Push-ups, squats, rows, planks, mountain climbers |

Plus **Incline Burn** (treadmill only) for off days and **Mobility & Stretch** for rest days.

Each day opens with a treadmill warm-up and closes with a 15–20 minute incline walk,
then stretching. Calisthenics come first while you're fresh — the dumbbell work exists
partly to make the bodyweight movements easier over time. Every template has a short
"why" on its detail screen, and every exercise has form cues behind the *How to* button.

Templates are fully editable, and you can build your own from scratch. Editing a
built-in one can always be undone with *Reset to original*.

## Layout

```
index.html              app shell
manifest.webmanifest    PWA manifest
sw.js                   service worker (offline cache)
css/app.css             design tokens + all styling
js/
  app.js                bootstrap, routing, chrome
  router.js             hash router
  store.js              state, PRs, volume, calorie + trend maths
  db.js                 IndexedDB wrapper
  ui.js                 DOM helpers, icons, sheets, toasts
  charts.js             dependency-free SVG charts
  theme.js              light/dark handling
  data/exercises.js     71-exercise library with form cues
  data/templates.js     the six built-in workouts
  views/                one module per screen
```

## A note on the numbers

Calorie figures use the ACSM walking equation for treadmill work (so incline genuinely
counts) and a MET estimate for lifting. Estimated 1RM uses the Epley formula, which is
reasonable up to about 12 reps. BMR and daily-burn figures come from Mifflin-St Jeor.

These are all estimates — good for watching a direction over weeks, not for precision.
Nothing here is medical advice.

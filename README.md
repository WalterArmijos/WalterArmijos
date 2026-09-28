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

To put it on your phone permanently, host it somewhere with HTTPS.

**GitHub Pages** is the simplest free option, and a workflow for it is already in the
repo at `.github/workflows/deploy.yml`. Switch it on once — repo *Settings → Pages →
Source: **GitHub Actions*** — and every push redeploys the site automatically. The URL
it gives you is the one you install from.

One thing to know: this is your `WalterArmijos/WalterArmijos` profile repo, so Pages
serves it at `https://walterarmijos.github.io/` — your user site, and publicly readable.
The code being public is harmless (your workout data never leaves your phone), but if
you'd rather it not sit at your profile URL, move these files to a repo of their own and
the same workflow deploys it to a project URL instead. Any static host — Netlify, Vercel,
Cloudflare Pages — works just as well with no changes.

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

| Workout | Movements | What's in it |
|---------|-----------|--------------|
| **Push** | 5 | Push-ups, DB bench, DB shoulder press, pushdowns, plank |
| **Legs** | 4 | Goblet squat, DB Romanian deadlift, reverse lunge, leg raise |
| **Pull** | 4 | Lat pulldown, cable row, hammer curl, side plank |
| **Calisthenics Circuit** | 4 | Push-ups, squats, inverted rows, planks — four rounds |

Each day is deliberately short: four or five movements, three or four sets each. More
sets of a lift you're already doing builds more than adding a sixth exercise, and a
short session you actually finish beats a long one you skip. Starting out, do two sets
of each and add a set a week.

The numbers on the list are just the suggested running order — rename any workout to
whatever you actually call it and the order stays.

Nothing is locked down — add sets or extra exercises mid-workout with *Add exercise*,
or change a template permanently with *Edit exercises*. The full 71-exercise library is
always available, including everything not in a template by default.

Plus three you can drop in whenever:

- **Cardio + Core** — treadmill intervals, side planks, hollow holds. ~35 min.
- **Incline Burn** — treadmill only, 35 minutes steady. The low-effort option.
- **Mobility & Stretch** — 12 minutes, for rest days.

Each day opens with a treadmill warm-up and closes with a 15–18 minute incline walk.
Calisthenics come first while you're fresh — the dumbbell work exists partly to make the
bodyweight movements easier over time. Stretching lives on its own Mobility day rather
than padding the end of every session. Every template has a short "why" on its detail
screen, and every exercise has form cues behind the *How to* button.

Templates are fully editable, and you can build your own from scratch. Every workout
can be renamed (*Rename*), have its exercises reworked (*Edit exercises*), be duplicated,
or be deleted. Deleting a built-in only hides it — a *Restore deleted workouts* button
appears at the bottom of the Workouts tab — and *Reset to original* undoes any edit,
including a rename.

Logged workouts can be renamed from their detail screen, and deleted either there or
straight from the list: **History → Edit**, then the bin icon on any row.

## Layout

```
.github/workflows/      one-click GitHub Pages deployment
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

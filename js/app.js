/** Bootstrap: routing, chrome, and the first paint. */
import { h, icon, toast } from './ui.js';
import * as S from './store.js';
import { defineRoutes, parseHash, go, back } from './router.js';
import { applyTheme, syncThemeColor } from './theme.js';
import { dbAvailable } from './db.js';

import { homeView } from './views/home.js';
import { templatesView, templateDetailView, templateEditView } from './views/templates.js';
import { sessionView, teardownSession } from './views/session.js';
import { historyView, workoutDetailView } from './views/history.js';
import { progressView } from './views/progress.js';
import { settingsView } from './views/settings.js';

const ROUTES = [
  { pattern: /^\/$/,                        title: () => greeting(), eyebrow: () => today(), tab: 'home',      render: homeView },
  { pattern: /^\/templates$/,               title: () => 'Workouts',  eyebrow: () => 'Your templates', tab: 'templates', render: templatesView },
  { pattern: /^\/template\/([^/]+)$/,       title: () => '',          back: true, tab: 'templates', render: (id) => templateDetailView(id) },
  { pattern: /^\/template\/([^/]+)\/edit$/, title: () => 'Edit',      back: true, tab: 'templates', render: (id) => templateEditView(id) },
  { pattern: /^\/session$/,                 title: () => S.state.active?.name || 'Workout', eyebrow: () => 'In progress', tab: 'session', render: sessionView },
  { pattern: /^\/history$/,                 title: () => 'History',   eyebrow: () => 'Everything you have logged', tab: 'history', render: historyView },
  { pattern: /^\/workout\/([^/]+)$/,        title: () => '',          back: true, tab: 'history', render: (id, params) => workoutDetailView(id, params) },
  { pattern: /^\/progress$/,                title: () => 'Progress',  eyebrow: () => 'The long view', tab: 'progress', render: progressView },
  { pattern: /^\/settings$/,                title: () => 'Settings',  eyebrow: () => '', tab: 'settings', render: settingsView },
];

const TABS = [
  { to: '/',          key: 'home',      label: 'Home',     ic: 'home' },
  { to: '/templates', key: 'templates', label: 'Workouts', ic: 'dumbbell' },
  { to: '/history',   key: 'history',   label: 'History',  ic: 'history' },
  { to: '/progress',  key: 'progress',  label: 'Progress', ic: 'chart' },
  { to: '/settings',  key: 'settings',  label: 'Settings', ic: 'settings' },
];

function greeting() {
  const hr = new Date().getHours();
  const name = S.state.settings.name;
  const base = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  return name ? `${base}, ${name}` : base;
}

const today = () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

/* ------------------------------------------------------------------ */
const app = document.getElementById('app');
let currentTab = 'home';

function paint(match) {
  const { route, args, params } = match;
  if (currentTab === 'session' && route.tab !== 'session') teardownSession();
  currentTab = route.tab;

  app.replaceChildren();

  const topbar = h('div', { class: 'topbar' });
  if (route.back) {
    topbar.append(h('button', { class: 'icon-btn plain', 'aria-label': 'Back', onClick: () => back() }, icon('back')));
  }
  const heading = route.title();
  if (heading || route.eyebrow?.()) {
    topbar.append(h('div', { style: { minWidth: '0', flex: '1' } },
      route.eyebrow?.() && h('div', { class: 'eyebrow' }, route.eyebrow()),
      heading && h('h1', { style: { fontSize: route.back ? '20px' : '27px' } }, heading),
    ));
  }
  if (route.tab === 'home') {
    topbar.append(h('div', { class: 'topbar-actions' },
      h('button', { class: 'icon-btn', 'aria-label': 'Settings', onClick: () => go('/settings') }, icon('settings'))));
  }
  app.append(topbar);

  app.append(route.render(...args, params));
  app.append(tabbar());

  // A persistent bar so an in-progress workout is never lost behind a tab.
  if (S.state.active && route.tab !== 'session') app.append(sessionBar());

  window.scrollTo(0, 0);
  syncThemeColor();
}

function tabbar() {
  return h('nav', { class: 'tabbar', 'aria-label': 'Main' },
    h('div', { class: 'tabbar-inner' },
      ...TABS.map(t => h('a', {
        class: 'tab', href: `#${t.to}`,
        'aria-current': currentTab === t.key ? 'page' : null,
      }, icon(t.ic), h('span', {}, t.label))),
    ),
  );
}

function sessionBar() {
  const a = S.state.active;
  const done = a.entries.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  const total = a.entries.reduce((n, e) => n + e.sets.length, 0);
  return h('div', { class: 'session-bar' },
    h('div', { class: 'session-bar-inner' },
      icon('timer'),
      h('div', {},
        h('div', { class: 't' }, a.name),
        h('div', { class: 's' }, `${done}/${total} sets logged`)),
      h('button', { class: 'go', onClick: () => go('/session') }, 'Resume'),
    ),
  );
}

/* ------------------------------------------------------------------ */
async function boot() {
  if (!(await dbAvailable())) {
    app.replaceChildren(h('div', { class: 'view', style: { paddingTop: '60px' } },
      h('h1', {}, 'Storage unavailable'),
      h('p', { class: 'muted', style: { marginTop: '10px' } },
        'This app stores your workouts in the browser database, which this browser has blocked — ' +
        'usually private browsing mode. Open it in a normal window and it will work.')));
    return;
  }

  await S.loadAll();
  applyTheme(S.state.settings.theme);

  defineRoutes(ROUTES, paint);
  paint(parseHash());

  S.onChange(() => {
    const bar = document.querySelector('.session-bar');
    if (bar && !S.state.active) bar.remove();
  });

  // Service worker: offline support. Harmless if the environment forbids it.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    try { await navigator.serviceWorker.register(new URL('./sw.js', location.href.replace(/[^/]*$/, '')).pathname); }
    catch { /* offline support unavailable — app still works online */ }
  }
}

window.addEventListener('error', e => {
  console.error(e.error || e.message);
  toast('Something went wrong — that action did not save.');
});

boot();

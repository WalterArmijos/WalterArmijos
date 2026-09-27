/** Hash router. Routes are declared in app.js and registered here. */
const routes = [];
let onNavigate = () => {};

export function defineRoutes(list, cb) {
  routes.length = 0;
  routes.push(...list);
  onNavigate = cb;
}

export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  for (const r of routes) {
    const m = path.match(r.pattern);
    if (m) return { route: r, args: m.slice(1).map(decodeURIComponent), params, path };
  }
  return { route: routes[0], args: [], params, path: '/' };
}

export function go(path, { replace = false } = {}) {
  const target = `#${path}`;
  if (location.hash === target) { onNavigate(parseHash()); return; }
  if (replace) history.replaceState(null, '', target);
  else location.hash = target;
}

export function back() {
  if (history.length > 1) history.back();
  else go('/');
}

window.addEventListener('hashchange', () => onNavigate(parseHash()));

/** Theme handling: system / light / dark, with the meta theme-color kept in sync. */
export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  syncThemeColor();
}

export function syncThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.body).backgroundColor;
  if (bg) meta.setAttribute('content', bg);
}

/** Repaint when the OS flips and we are following it. */
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!document.documentElement.hasAttribute('data-theme')) syncThemeColor();
});

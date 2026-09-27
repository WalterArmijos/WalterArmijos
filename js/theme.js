/** Theme handling: system / light / dark, with the meta theme-color kept in sync. */
export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  syncThemeColor();
}

export function syncThemeColor() {
  // The meta tag may not exist when the page is embedded in a host shell.
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
  }
  const bg = getComputedStyle(document.body).backgroundColor;
  if (bg) meta.setAttribute('content', bg);
}

/** Repaint when the OS flips and we are following it. */
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!document.documentElement.hasAttribute('data-theme')) syncThemeColor();
});

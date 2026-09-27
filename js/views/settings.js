/** Settings: profile, theme, timers, backup. */
import { h, icon, frag, sheet, confirmSheet, promptSheet, toast } from '../ui.js';
import * as S from '../store.js';
import { applyTheme } from '../theme.js';
import { go } from '../router.js';

export function settingsView() {
  const { settings } = S.state;
  const view = h('div', { class: 'view' });

  /* -------------------- profile -------------------- */
  view.append(
    h('div', { class: 'section-title', style: { marginTop: '4px' } }, 'You'),
    h('div', { class: 'card' },
      editRow('Height', formatHeight(settings.heightIn), () => promptSheet({
        title: 'Height', label: 'Inches', type: 'number', value: String(settings.heightIn),
        hint: `5'7" is 67 inches.`,
        onSave: v => { const n = parseFloat(v); if (n > 30 && n < 100) S.saveSettings({ heightIn: n }); },
      })),
      editRow('Starting weight', `${settings.startWeight} lb`, () => promptSheet({
        title: 'Starting weight', label: 'Pounds', type: 'number', value: String(settings.startWeight),
        hint: 'What you weighed when you began. Used for the "down X lb" number.',
        onSave: v => { const n = parseFloat(v); if (n > 50) S.saveSettings({ startWeight: n }); },
      })),
      editRow('Goal weight', `${settings.goalWeight} lb`, () => promptSheet({
        title: 'Goal weight', label: 'Pounds', type: 'number', value: String(settings.goalWeight),
        onSave: v => { const n = parseFloat(v); if (n > 50) S.saveSettings({ goalWeight: n }); },
      })),
      editRow('Age', String(settings.age), () => promptSheet({
        title: 'Age', label: 'Years', type: 'number', value: String(settings.age),
        hint: 'Only used for the calorie estimates.',
        onSave: v => { const n = parseInt(v, 10); if (n > 10 && n < 100) S.saveSettings({ age: n }); },
      })),
    ),
  );

  /* -------------------- appearance -------------------- */
  view.append(
    h('div', { class: 'section-title' }, 'Appearance'),
    h('div', { class: 'card' },
      h('div', { class: 'spread', style: { marginBottom: '10px' } },
        h('span', { class: 'small', style: { fontWeight: '640' } }, 'Theme')),
      h('div', { class: 'segmented' },
        ...[['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) =>
          h('button', {
            'aria-pressed': String(settings.theme === v),
            onClick: async (e) => {
              const btn = e.currentTarget;          // goes null after the await
              const group = btn.parentElement;
              applyTheme(v);
              group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
              btn.setAttribute('aria-pressed', 'true');
              await S.saveSettings({ theme: v });
            },
          }, l))),
    ),
  );

  /* -------------------- timers -------------------- */
  view.append(
    h('div', { class: 'section-title' }, 'During a workout'),
    h('div', { class: 'card' },
      toggleRow('Start rest timer automatically', 'When you check off a set', settings.restAuto,
        v => S.saveSettings({ restAuto: v })),
      h('div', { class: 'divider' }),
      editRow('Default rest', `${settings.restDefault}s`, () => promptSheet({
        title: 'Default rest', label: 'Seconds', type: 'number', value: String(settings.restDefault),
        hint: 'Used for exercises you add on the fly. Templates carry their own rest times.',
        onSave: v => { const n = parseInt(v, 10); if (n >= 0) S.saveSettings({ restDefault: n }); },
      })),
      h('div', { class: 'divider' }),
      toggleRow('Sound', 'Chime when rest is up', settings.sound, v => S.saveSettings({ sound: v })),
      h('div', { class: 'divider' }),
      toggleRow('Vibration', 'Buzz on set completion and timers', settings.vibrate, v => S.saveSettings({ vibrate: v })),
      h('div', { class: 'divider' }),
      toggleRow('Keep screen awake', 'Stops the phone sleeping mid-set', settings.keepScreenOn,
        v => S.saveSettings({ keepScreenOn: v })),
    ),
  );

  /* -------------------- data -------------------- */
  view.append(
    h('div', { class: 'section-title' }, 'Your data'),
    h('div', { class: 'card' },
      h('p', { class: 'small muted', style: { marginBottom: '13px', lineHeight: '1.5' } },
        'Everything lives on this device only — no account, no server, nobody else can see it. ' +
        'That also means clearing your browser data wipes it, so export a backup now and then.'),
      h('div', { class: 'stack' },
        h('button', { class: 'btn btn-block', onClick: doExport }, icon('download'), 'Export backup'),
        h('button', { class: 'btn btn-block', onClick: doImport }, icon('upload'), 'Restore from backup'),
      ),
      h('div', { class: 'divider' }),
      h('div', { class: 'spread small' },
        h('span', { class: 'muted' }, 'Stored on this device'),
        h('span', { class: 'dim tnum' },
          `${S.state.sessions.length} workouts · ${S.state.bodyweight.length} weigh-ins`)),
    ),
    h('div', { class: 'card' },
      h('button', { class: 'btn btn-danger btn-block', onClick: () => confirmSheet({
        title: 'Erase everything?',
        message: 'Every workout, weigh-in, custom template and setting on this device will be deleted permanently. Export a backup first if you might want any of it back.',
        confirmText: 'Erase all data', danger: true,
        onConfirm: async () => {
          const { db } = await import('../db.js');
          await db.wipe();
          location.reload();
        },
      }) }, icon('trash'), 'Erase all data'),
    ),
  );

  /* -------------------- about -------------------- */
  view.append(
    h('div', { class: 'section-title' }, 'About'),
    h('div', { class: 'card' },
      h('div', { class: 'spread small' }, h('span', { class: 'muted' }, 'Ironlog'), h('span', { class: 'dim' }, 'v1.0')),
      h('p', { class: 'xsmall dim', style: { marginTop: '10px', lineHeight: '1.55' } },
        'Built for one gym, one person. Calorie and 1RM figures are estimates from standard equations — useful for tracking direction over time, not for precision. ' +
        'Nothing here is medical advice; if something hurts in a way that is not muscle soreness, get it looked at.'),
    ),
  );

  return view;
}

/* ------------------------------------------------------------------ */
function editRow(label, value, onClick) {
  return h('button', { class: 'spread', style: { width: '100%', padding: '9px 0', textAlign: 'left' }, onClick },
    h('span', { class: 'small', style: { fontWeight: '640' } }, label),
    h('span', { class: 'row', style: { gap: '4px' } },
      h('span', { class: 'small dim tnum' }, value),
      h('span', { style: { color: 'var(--text-3)', display: 'flex' } }, icon('chevron'))),
  );
}

function toggleRow(label, sub, checked, onChange) {
  const input = h('input', { type: 'checkbox', checked, onChange: e => onChange(e.target.checked) });
  return h('div', { class: 'spread', style: { padding: '3px 0' } },
    h('div', {},
      h('div', { class: 'small', style: { fontWeight: '640' } }, label),
      h('div', { class: 'xsmall dim' }, sub)),
    h('span', { class: 'switch' }, input, h('span', { class: 'track' }), h('span', { class: 'thumb' })),
  );
}

function formatHeight(inches) {
  return `${Math.floor(inches / 12)}'${Math.round(inches % 12)}"`;
}

async function doExport() {
  const data = await S.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `ironlog-backup-${S.todayKey()}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Backup downloaded');
}

function doImport() {
  const input = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      confirmSheet({
        title: 'Restore this backup?',
        message: `${json.sessions?.length ?? 0} workouts and ${json.bodyweight?.length ?? 0} weigh-ins from ${
          json.exportedAt ? new Date(json.exportedAt).toLocaleDateString() : 'an unknown date'
        }. Anything already on this device with the same id is overwritten.`,
        confirmText: 'Restore',
        onConfirm: async () => {
          try {
            await S.importData(json);
            toast('Backup restored');
            go('/');
          } catch (err) { toast(err.message || 'Could not restore that file'); }
        },
      });
    } catch { toast('That file is not valid JSON'); }
    input.remove();
  });
  document.body.append(input);
  input.click();
}

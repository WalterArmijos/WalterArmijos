/**
 * IndexedDB wrapper. Everything lives on this device — no server, no account.
 * Stores:
 *   sessions    — completed workouts, keyed by id, indexed by startedAt
 *   templates   — user-created / user-edited templates (overrides built-ins by id)
 *   exercises   — user-created custom exercises
 *   bodyweight  — daily weigh-ins, keyed by YYYY-MM-DD
 *   kv          — settings, the in-progress session, misc flags
 */
const DB_NAME = 'ironlog';
const DB_VERSION = 1;
const STORES = ['sessions', 'templates', 'exercises', 'bodyweight', 'kv'];

let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sessions')) {
        const s = db.createObjectStore('sessions', { keyPath: 'id' });
        s.createIndex('startedAt', 'startedAt');
      }
      if (!db.objectStoreNames.contains('templates')) db.createObjectStore('templates', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('exercises')) db.createObjectStore('exercises', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('bodyweight')) db.createObjectStore('bodyweight', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'k' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Database blocked — close other tabs of this app.'));
  });
  return dbp;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const db = {
  get:    (store, key)  => tx(store, 'readonly',  s => s.get(key)),
  all:    (store)       => tx(store, 'readonly',  s => s.getAll()),
  put:    (store, val)  => tx(store, 'readwrite', s => s.put(val)),
  del:    (store, key)  => tx(store, 'readwrite', s => s.delete(key)),
  clear:  (store)       => tx(store, 'readwrite', s => s.clear()),
  putAll: async (store, vals) => {
    const database = await open();
    return new Promise((resolve, reject) => {
      const t = database.transaction(store, 'readwrite');
      const os = t.objectStore(store);
      vals.forEach(v => os.put(v));
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
  },
  async wipe() {
    for (const s of STORES) await tx(s, 'readwrite', os => os.clear());
  },
};

/** Small helpers for the kv store. */
export const kv = {
  async get(k, fallback = null) {
    const row = await db.get('kv', k);
    return row === undefined || row === null ? fallback : row.v;
  },
  set: (k, v) => db.put('kv', { k, v }),
  del: (k) => db.del('kv', k),
};

/** True if IndexedDB is usable at all (private mode / locked-down browsers). */
export async function dbAvailable() {
  try { await open(); return true; } catch { return false; }
}

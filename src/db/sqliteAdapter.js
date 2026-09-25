// SQLite-on-disk adapter.
//
// Runs SQLite entirely in the browser via sql.js (SQLite compiled to
// WebAssembly). The actual .sqlite bytes live wherever the user chooses via
// the File System Access API (Chrome/Edge) — this app never sends the
// database anywhere.
//
// The chosen FileSystemFileHandle is itself stored in IndexedDB (handles are
// structured-cloneable), so on the next visit we can silently re-request
// permission and reopen the same file without the user picking it again.

import { SQL_SCHEMA, COMIC_FIELDS } from './schema.js';

const HANDLE_DB_NAME = 'comicvault-handles';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'lastFile';

let SQL = null; // sql.js module, loaded once
async function loadSqlJs() {
  if (SQL) return SQL;
  const initSqlJs = (await import('sql.js')).default;
  SQL = await initSqlJs({
    // sql.js needs its .wasm binary; fetching the matching version from a
    // CDN avoids extra build config. Pin the version to match package.json.
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`,
  });
  return SQL;
}

// --- tiny helper store just for remembering the file handle -------------
function openHandleDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(HANDLE_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function rememberHandle(handle) {
  const db = await openHandleDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function recallHandle() {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readonly');
    const req = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function rowsToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

function normalizeOut(row) {
  return {
    ...row,
    isRead: !!row.isRead,
    isFavorite: !!row.isFavorite,
  };
}

export async function createSqliteAdapter() {
  const sqlJs = await loadSqlJs();
  let db = new sqlJs.Database();
  db.run(SQL_SCHEMA);

  let fileHandle = null;
  let fileName = null;

  async function tryRestorePreviousFile() {
    try {
      const handle = await recallHandle();
      if (!handle) return;
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        const req = await handle.requestPermission({ mode: 'readwrite' });
        if (req !== 'granted') return;
      }
      const file = await handle.getFile();
      const buf = new Uint8Array(await file.arrayBuffer());
      db.close();
      db = new sqlJs.Database(buf);
      db.run(SQL_SCHEMA); // no-op if table already exists, cheap safety net
      fileHandle = handle;
      fileName = file.name;
    } catch {
      // Permission denied or handle stale — silently fall back to a fresh
      // in-memory database; the user can pick a file again from the toolbar.
    }
  }

  async function persist() {
    if (!fileHandle) return;
    const bytes = db.export();
    const writable = await fileHandle.createWritable();
    await writable.write(bytes);
    await writable.close();
  }

  function insertSql() {
    const cols = COMIC_FIELDS.map((f) => f.key).concat(['coverImage', 'backImage']);
    const placeholders = cols.map(() => '?').join(', ');
    return `INSERT INTO comics (${cols.join(', ')}) VALUES (${placeholders})`;
  }
  function updateSql() {
    const cols = COMIC_FIELDS.map((f) => f.key).concat(['coverImage', 'backImage']);
    const setClause = cols.map((c) => `${c} = ?`).join(', ');
    return `UPDATE comics SET ${setClause}, updatedAt = datetime('now') WHERE id = ?`;
  }
  function valuesFor(comic) {
    const cols = COMIC_FIELDS.map((f) => f.key).concat(['coverImage', 'backImage']);
    return cols.map((c) => {
      if (c === 'isRead' || c === 'isFavorite') return comic[c] ? 1 : 0;
      return comic[c] ?? null;
    });
  }

  return {
    hasFileAccess: true,
    get fileName() {
      return fileName;
    },

    async init() {
      await tryRestorePreviousFile();
    },

    async getAll() {
      const res = db.exec('SELECT * FROM comics ORDER BY series, issueNumber, title');
      return rowsToObjects(res).map(normalizeOut);
    },

    async add(comic) {
      db.run(insertSql(), valuesFor(comic));
      const [{ id }] = rowsToObjects(db.exec('SELECT last_insert_rowid() AS id'));
      await persist();
      return { ...comic, id };
    },

    async update(id, comic) {
      db.run(updateSql(), [...valuesFor(comic), id]);
      await persist();
    },

    async remove(id) {
      db.run('DELETE FROM comics WHERE id = ?', [id]);
      await persist();
    },

    // --- file management, exposed to the toolbar ---
    async newFile() {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'comicvault.sqlite',
        types: [{ description: 'SQLite database', accept: { 'application/x-sqlite3': ['.sqlite'] } }],
      });
      db.close();
      db = new sqlJs.Database();
      db.run(SQL_SCHEMA);
      fileHandle = handle;
      fileName = handle.name;
      await rememberHandle(handle);
      await persist();
    },

    async openFile() {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'SQLite database', accept: { 'application/x-sqlite3': ['.sqlite'] } }],
      });
      const file = await handle.getFile();
      const buf = new Uint8Array(await file.arrayBuffer());
      db.close();
      db = new sqlJs.Database(buf);
      db.run(SQL_SCHEMA);
      fileHandle = handle;
      fileName = file.name;
      await rememberHandle(handle);
    },

    async saveFile() {
      if (!fileHandle) {
        await this.newFile();
        return;
      }
      await persist();
    },
  };
}

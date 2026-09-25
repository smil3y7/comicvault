// Fallback adapter for browsers without the File System Access API
// (Firefox, Safari). Data lives only in this browser's IndexedDB — there is
// no on-disk file the user can point at, so the app relies on the JSON
// export/import (see src/export/exportJson.js) for backups or moving data
// to another device.

import { openDB } from 'idb';

const DB_NAME = 'comicvault';
const STORE = 'comics';

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    },
  });
}

export async function createIndexedDbAdapter() {
  const db = await getDb();

  return {
    hasFileAccess: false,
    fileName: null,

    async init() {
      // nothing to restore — IndexedDB is already the persistent store
    },

    async getAll() {
      const all = await db.getAll(STORE);
      return all.sort((a, b) =>
        (a.series || '').localeCompare(b.series || '') ||
        (a.issueNumber || '').localeCompare(b.issueNumber || '') ||
        (a.title || '').localeCompare(b.title || ''),
      );
    },

    async add(comic) {
      const id = await db.add(STORE, { ...comic, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      return { ...comic, id };
    },

    async update(id, comic) {
      await db.put(STORE, { ...comic, id, updatedAt: new Date().toISOString() });
    },

    async remove(id) {
      await db.delete(STORE, id);
    },

    // No file concept here; the toolbar hides these buttons when
    // hasFileAccess is false, but keep no-ops so callers never crash.
    async newFile() {},
    async openFile() {},
    async saveFile() {},
  };
}

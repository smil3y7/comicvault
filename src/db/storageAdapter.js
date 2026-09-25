// Storage abstraction used by the whole app.
//
// UI components never talk to sql.js or IndexedDB directly — only to the
// object this factory returns. That keeps the door open for a future
// "remote" adapter (e.g. Turso/libSQL) without touching any component.
//
// Contract implemented by every adapter:
//   init()                 -> Promise<void>
//   getAll()                -> Promise<Comic[]>
//   add(comic)              -> Promise<Comic>            (returns comic with id)
//   update(id, comic)       -> Promise<void>
//   remove(id)               -> Promise<void>
//   hasFileAccess: boolean   (true if backed by a real file on disk)
//   fileName: string | null  (name of the currently open file, if any)
//   newFile()   (sqlite adapter only) -> Promise<void>  create+pick a new .sqlite file
//   openFile()  (sqlite adapter only) -> Promise<void>  pick an existing .sqlite file
//   saveFile()  (sqlite adapter only) -> Promise<void>  flush current DB to disk

import { createSqliteAdapter } from './sqliteAdapter.js';
import { createIndexedDbAdapter } from './indexedDbAdapter.js';

export function fileSystemAccessSupported() {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

// Creates the best available adapter for this browser. The sqlite adapter
// itself falls back to an in-memory-only sql.js database (still exposed
// through the same interface) if the user hasn't opened/created a file yet;
// the plain IndexedDB adapter is used on browsers without File System
// Access support (Firefox, Safari) so the app still works, just without a
// portable single-file export.
export async function createStorage() {
  if (fileSystemAccessSupported()) {
    return createSqliteAdapter();
  }
  return createIndexedDbAdapter();
}

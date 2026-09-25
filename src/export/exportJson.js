// Full-fidelity backup format — includes images as data URLs so a single
// .json file is enough to restore (or move to another device/browser)
// everything the sqlite/IndexedDB adapters store.

export function exportJson(comics) {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'ComicVault',
    version: 1,
    comics,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `comicvault-export-${dateStamp()}.json`);
}

export function parseImportedJson(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data.comics)) throw new Error('Invalid ComicVault export file');
  return data.comics;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export { dateStamp };

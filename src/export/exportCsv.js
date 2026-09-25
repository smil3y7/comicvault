import { COMIC_FIELDS } from '../db/schema.js';
import { downloadBlob, dateStamp } from './exportJson.js';

function csvEscape(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// CSV intentionally excludes the two image fields (base64 data would make
// the file unwieldy and useless in a spreadsheet) — use the JSON export for
// a full backup including images.
export function exportCsv(comics, t) {
  const cols = COMIC_FIELDS.map((f) => f.key);
  const header = cols.map((key) => t(`fields.${key}`));
  const rows = comics.map((comic) =>
    cols.map((key) => {
      const field = COMIC_FIELDS.find((f) => f.key === key);
      let value = comic[key];
      if (field.type === 'boolean') value = value ? 1 : 0;
      if (field.type === 'select' && value) value = t(`conditions.${value}`);
      return csvEscape(value);
    }),
  );
  const csv = [header, ...rows].map((r) => r.join(',')).join('\r\n');
  // BOM so Excel opens UTF-8 (šumniki) correctly.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `comicvault-export-${dateStamp()}.csv`);
}

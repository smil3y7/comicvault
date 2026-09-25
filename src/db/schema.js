// Central definition of a "comic" record.
// Every field lives here ONCE — the form, the SQLite schema, the IndexedDB
// store and the CSV/PDF exporters all read from this list, so adding a new
// field never means hunting through multiple files.
//
// type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean'
// group: used to visually cluster fields in the form
export const COMIC_FIELDS = [
  { key: 'title', type: 'text', required: true, group: 'main' },
  { key: 'series', type: 'text', group: 'main' },
  { key: 'issueNumber', type: 'text', group: 'main' },
  { key: 'publisher', type: 'text', group: 'main' },
  { key: 'releaseDate', type: 'date', group: 'main' },

  { key: 'writer', type: 'text', group: 'credits' },
  { key: 'artist', type: 'text', group: 'credits' },
  { key: 'variantCover', type: 'text', group: 'credits' },
  { key: 'language', type: 'text', group: 'credits' },
  { key: 'isbnBarcode', type: 'text', group: 'credits' },

  {
    key: 'condition',
    type: 'select',
    group: 'ownership',
    options: [
      'mint',
      'nearMint',
      'veryFine',
      'fine',
      'veryGood',
      'good',
      'fair',
      'poor',
    ],
  },
  { key: 'purchasePrice', type: 'number', group: 'ownership' },
  { key: 'estimatedValue', type: 'number', group: 'ownership' },
  { key: 'purchaseDate', type: 'date', group: 'ownership' },
  { key: 'purchaseSource', type: 'text', group: 'ownership' },
  { key: 'location', type: 'text', group: 'ownership' },

  { key: 'isRead', type: 'boolean', group: 'flags' },
  { key: 'isFavorite', type: 'boolean', group: 'flags' },
  { key: 'notes', type: 'textarea', group: 'flags' },
];

// Image fields are handled separately from COMIC_FIELDS because they need
// file-input / preview UI rather than a plain text control.
export const IMAGE_FIELDS = [
  { key: 'coverImage', label: 'coverImage' },
  { key: 'backImage', label: 'backImage' },
];

export const FIELD_GROUPS = ['main', 'credits', 'ownership', 'flags'];

export function emptyComic() {
  const comic = {};
  for (const f of COMIC_FIELDS) {
    comic[f.key] = f.type === 'boolean' ? false : '';
  }
  comic.coverImage = null;
  comic.backImage = null;
  return comic;
}

// SQL DDL — camelCase column names are valid in SQLite and keep this file
// as the single source of truth (no snake_case <-> camelCase mapping layer).
export const SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS comics (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  series          TEXT,
  issueNumber     TEXT,
  publisher       TEXT,
  releaseDate     TEXT,
  writer          TEXT,
  artist          TEXT,
  variantCover    TEXT,
  language        TEXT,
  isbnBarcode     TEXT,
  condition       TEXT,
  purchasePrice   REAL,
  estimatedValue  REAL,
  purchaseDate    TEXT,
  purchaseSource  TEXT,
  location        TEXT,
  isRead          INTEGER DEFAULT 0,
  isFavorite      INTEGER DEFAULT 0,
  notes           TEXT,
  coverImage      TEXT,
  backImage       TEXT,
  createdAt       TEXT DEFAULT (datetime('now')),
  updatedAt       TEXT DEFAULT (datetime('now'))
);
`;

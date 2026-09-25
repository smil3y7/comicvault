import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import ComicCard from './ComicCard.jsx';
import './ComicList.css';

function matches(comic, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return ['title', 'series', 'writer', 'artist', 'publisher'].some((key) =>
    (comic[key] || '').toLowerCase().includes(q),
  );
}

export default function ComicList({ comics, search, onOpen }) {
  const { t } = useI18n();
  const [sortBy, setSortBy] = useState('series');

  const filtered = useMemo(() => {
    const list = comics.filter((c) => matches(c, search));
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'value') return (b.estimatedValue || 0) - (a.estimatedValue || 0);
      if (sortBy === 'date') return (b.purchaseDate || '').localeCompare(a.purchaseDate || '');
      // default: series, then issue number, then title
      return (
        (a.series || '').localeCompare(b.series || '') ||
        (a.issueNumber || '').localeCompare(b.issueNumber || '', undefined, { numeric: true }) ||
        (a.title || '').localeCompare(b.title || '')
      );
    });
    return sorted;
  }, [comics, search, sortBy]);

  if (comics.length === 0) {
    return <p className="comic-list__empty">{t('list.empty')}</p>;
  }

  return (
    <div>
      <div className="comic-list__bar">
        <span className="comic-list__count">{t('list.count', { count: filtered.length })}</span>
        <label className="comic-list__sort">
          {t('list.sortBy')}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="series">{t('list.sortSeries')}</option>
            <option value="title">{t('list.sortTitle')}</option>
            <option value="value">{t('list.sortValue')}</option>
            <option value="date">{t('list.sortDate')}</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="comic-list__empty">{t('list.noResults')}</p>
      ) : (
        <div className="comic-list__grid">
          {filtered.map((comic) => (
            <ComicCard key={comic.id} comic={comic} onClick={() => onOpen(comic.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

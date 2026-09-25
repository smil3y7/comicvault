import { useI18n } from '../i18n/index.jsx';
import './ComicCard.css';

export default function ComicCard({ comic, onClick }) {
  const { t } = useI18n();

  return (
    <button className="comic-card" onClick={onClick}>
      <div className="comic-card__cover">
        {comic.coverImage ? (
          <img src={comic.coverImage} alt="" />
        ) : (
          <div className="comic-card__placeholder">{t('fields.coverImage')}</div>
        )}
        {comic.isFavorite ? <span className="comic-card__favorite" title={t('fields.isFavorite')}>★</span> : null}
      </div>
      <div className="comic-card__body">
        <div className="comic-card__series">{comic.series || '\u00A0'}</div>
        <div className="comic-card__title">{comic.title}</div>
        <div className="comic-card__issue">{comic.issueNumber ? `#${comic.issueNumber}` : ''}</div>
      </div>
    </button>
  );
}

import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { COMIC_FIELDS, FIELD_GROUPS } from '../db/schema.js';
import './ComicDetail.css';

function displayValue(field, value, t) {
  if (field.type === 'boolean') return value ? '✓' : '—';
  if (field.type === 'select') return value ? t(`conditions.${value}`) : '—';
  if (field.type === 'number' && value !== '' && value != null) return value;
  return value || '—';
}

export default function ComicDetail({ comic, onEdit, onDelete, onBack }) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="comic-detail">
      <button className="btn btn--ghost" onClick={onBack}>
        ← {t('detail.back')}
      </button>

      <div className="comic-detail__header">
        <div className="comic-detail__covers">
          {comic.coverImage && <img src={comic.coverImage} alt="" />}
          {comic.backImage && <img src={comic.backImage} alt="" />}
        </div>
        <div>
          <div className="comic-detail__series">{comic.series}</div>
          <h2>
            {comic.title} {comic.issueNumber ? <span className="comic-detail__issue">#{comic.issueNumber}</span> : null}
          </h2>
          <div className="comic-detail__actions">
            <button className="btn btn--primary" onClick={onEdit}>
              {t('detail.edit')}
            </button>
            <button className="btn btn--danger" onClick={() => setConfirming(true)}>
              {t('detail.delete')}
            </button>
          </div>
        </div>
      </div>

      {FIELD_GROUPS.map((group) => (
        <div className="comic-detail__group" key={group}>
          <h3>{t(`groups.${group}`)}</h3>
          <dl>
            {COMIC_FIELDS.filter((f) => f.group === group).map((f) => (
              <div className="comic-detail__row" key={f.key}>
                <dt>{t(`fields.${f.key}`)}</dt>
                <dd>{displayValue(f, comic[f.key], t)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      {confirming && (
        <div className="comic-detail__confirm">
          <p>
            <strong>{t('detail.confirmDeleteTitle')}</strong>
            <br />
            {t('detail.confirmDeleteBody')}
          </p>
          <div className="comic-detail__actions">
            <button className="btn" onClick={() => setConfirming(false)}>
              {t('detail.confirmDeleteNo')}
            </button>
            <button className="btn btn--danger" onClick={onDelete}>
              {t('detail.confirmDeleteYes')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

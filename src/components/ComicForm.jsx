import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { COMIC_FIELDS, FIELD_GROUPS, IMAGE_FIELDS, emptyComic } from '../db/schema.js';
import { compressImage } from '../utils/image.js';
import './ComicForm.css';

function Field({ field, value, onChange, error }) {
  const { t } = useI18n();
  const label = t(`fields.${field.key}`);

  if (field.type === 'select') {
    return (
      <label className="field">
        <span>{label}</span>
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">{t('form.selectPlaceholder')}</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {t(`conditions.${opt}`)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'boolean') {
    return (
      <label className="field field--checkbox">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className="field field--wide">
        <span>{label}</span>
        <textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }

  return (
    <label className="field">
      <span>
        {label}
        {field.required ? ' *' : ''}
      </span>
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        step={field.type === 'number' ? '0.01' : undefined}
      />
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

function ImageField({ fieldKey, value, onChange }) {
  const { t } = useI18n();
  const [processing, setProcessing] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setProcessing(true);
    try {
      onChange(await compressImage(file));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="image-field">
      <span className="image-field__label">{t(`fields.${fieldKey}`)}</span>
      <div className="image-field__preview">
        {value ? <img src={value} alt="" /> : <div className="image-field__placeholder">—</div>}
      </div>
      <div className="image-field__actions">
        <label className="btn btn--ghost">
          {processing ? '…' : t('form.chooseImage')}
          <input type="file" accept="image/*" onChange={handleFile} disabled={processing} className="visually-hidden" />
        </label>
        {value && (
          <button type="button" className="btn btn--ghost" onClick={() => onChange(null)}>
            {t('form.removeImage')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ComicForm({ initialComic, onSave, onCancel }) {
  const { t } = useI18n();
  const [comic, setComic] = useState(initialComic ?? emptyComic());
  const [errors, setErrors] = useState({});
  const isEdit = !!initialComic?.id;

  function setField(key, value) {
    setComic((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const errs = {};
    for (const f of COMIC_FIELDS) {
      if (f.required && !String(comic[f.key] ?? '').trim()) errs[f.key] = t('form.requiredField');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave(comic);
  }

  return (
    <form className="comic-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? t('form.editTitle') : t('form.addTitle')}</h2>

      <div className="comic-form__images">
        {IMAGE_FIELDS.map((img) => (
          <ImageField key={img.key} fieldKey={img.key} value={comic[img.key]} onChange={(v) => setField(img.key, v)} />
        ))}
      </div>

      {FIELD_GROUPS.map((group) => (
        <fieldset className="comic-form__group" key={group}>
          <legend>{t(`groups.${group}`)}</legend>
          <div className="comic-form__grid">
            {COMIC_FIELDS.filter((f) => f.group === group).map((f) => (
              <Field key={f.key} field={f} value={comic[f.key]} onChange={(v) => setField(f.key, v)} error={errors[f.key]} />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="comic-form__actions">
        <button type="button" className="btn" onClick={onCancel}>
          {t('form.cancel')}
        </button>
        <button type="submit" className="btn btn--primary">
          {t('form.save')}
        </button>
      </div>
    </form>
  );
}

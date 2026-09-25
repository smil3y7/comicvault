import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { useTheme } from '../styles/ThemeContext.jsx';
import './Toolbar.css';

export default function Toolbar({
  storage,
  fileName,
  onFileChanged,
  search,
  onSearchChange,
  onExportJson,
  onExportCsv,
  onExportPdfChecklist,
  onExportPdfCatalog,
}) {
  const { t, lang, setLang, languages } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleNewFile() {
    await storage.newFile();
    onFileChanged();
  }
  async function handleOpenFile() {
    await storage.openFile();
    onFileChanged();
  }
  async function handleSaveFile() {
    await storage.saveFile();
    onFileChanged();
  }

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        {storage.hasFileAccess && (
          <div className="toolbar__group">
            <button className="btn btn--ghost" onClick={handleNewFile}>
              {t('toolbar.newFile')}
            </button>
            <button className="btn btn--ghost" onClick={handleOpenFile}>
              {t('toolbar.openFile')}
            </button>
            <button className="btn btn--ghost" onClick={handleSaveFile}>
              {t('toolbar.saveFile')}
            </button>
            <span className="toolbar__filename" title={fileName || ''}>
              {fileName || t('toolbar.noFileOpen')}
            </span>
          </div>
        )}

        <div className="toolbar__spacer" />

        <div className="toolbar__group" ref={exportRef} style={{ position: 'relative' }}>
          <button className="btn btn--ghost" onClick={() => setExportOpen((v) => !v)}>
            {t('toolbar.export')} ▾
          </button>
          {exportOpen && (
            <div className="toolbar__menu">
              <button onClick={() => { setExportOpen(false); onExportJson(); }}>{t('toolbar.exportJson')}</button>
              <button onClick={() => { setExportOpen(false); onExportCsv(); }}>{t('toolbar.exportCsv')}</button>
              <button onClick={() => { setExportOpen(false); onExportPdfChecklist(); }}>{t('toolbar.exportPdfChecklist')}</button>
              <button onClick={() => { setExportOpen(false); onExportPdfCatalog(); }}>{t('toolbar.exportPdfCatalog')}</button>
            </div>
          )}
        </div>

        <button className="btn btn--icon" onClick={toggleTheme} aria-label={t('theme.toggle')} title={t('theme.toggle')}>
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <select
          className="toolbar__lang"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label={t('language.toggle')}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.code.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {!storage.hasFileAccess && <p className="toolbar__notice">{t('toolbar.fileAccessUnsupported')}</p>}

      <div className="toolbar__row">
        <input
          className="toolbar__search"
          type="search"
          placeholder={t('toolbar.search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}

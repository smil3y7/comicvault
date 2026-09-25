import { useEffect, useState, useCallback } from 'react';
import { createStorage } from './db/storageAdapter.js';
import { useI18n } from './i18n/index.jsx';
import Toolbar from './components/Toolbar.jsx';
import ComicList from './components/ComicList.jsx';
import ComicForm from './components/ComicForm.jsx';
import ComicDetail from './components/ComicDetail.jsx';
import { exportJson } from './export/exportJson.js';
import { exportCsv } from './export/exportCsv.js';
import { exportPdfChecklist, exportPdfCatalog } from './export/exportPdf.js';
import './App.css';

export default function App() {
  const { t } = useI18n();
  const [storage, setStorage] = useState(null);
  const [comics, setComics] = useState([]);
  const [view, setView] = useState({ name: 'list' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const adapter = await createStorage();
      await adapter.init();
      if (cancelled) return;
      setStorage(adapter);
      setComics(await adapter.getAll());
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!storage) return;
    setComics(await storage.getAll());
  }, [storage]);

  async function handleSave(comic) {
    if (comic.id) {
      await storage.update(comic.id, comic);
    } else {
      await storage.add(comic);
    }
    await refresh();
    setView({ name: 'list' });
  }

  async function handleDelete(id) {
    await storage.remove(id);
    await refresh();
    setView({ name: 'list' });
  }

  const selectedComic = view.id ? comics.find((c) => c.id === view.id) : null;

  return (
    <div className="container">
      <header className="app-header">
        <div>
          <h1>{t('app.title')}</h1>
          <p className="app-header__tagline">{t('app.tagline')}</p>
        </div>
        {view.name === 'list' && (
          <button className="btn btn--primary" onClick={() => setView({ name: 'form-add' })}>
            + {t('nav.addComic')}
          </button>
        )}
      </header>

      {storage && (
        <Toolbar
          storage={storage}
          fileName={storage.fileName}
          onFileChanged={refresh}
          search={search}
          onSearchChange={setSearch}
          onExportJson={() => exportJson(comics)}
          onExportCsv={() => exportCsv(comics, t)}
          onExportPdfChecklist={() => exportPdfChecklist(comics, t)}
          onExportPdfCatalog={() => exportPdfCatalog(comics, t)}
        />
      )}

      {loading && <p className="app-loading">…</p>}

      {!loading && view.name === 'list' && (
        <ComicList comics={comics} search={search} onOpen={(id) => setView({ name: 'detail', id })} />
      )}

      {!loading && view.name === 'form-add' && (
        <ComicForm onSave={handleSave} onCancel={() => setView({ name: 'list' })} />
      )}

      {!loading && view.name === 'form-edit' && selectedComic && (
        <ComicForm initialComic={selectedComic} onSave={handleSave} onCancel={() => setView({ name: 'detail', id: view.id })} />
      )}

      {!loading && view.name === 'detail' && selectedComic && (
        <ComicDetail
          comic={selectedComic}
          onEdit={() => setView({ name: 'form-edit', id: view.id })}
          onDelete={() => handleDelete(view.id)}
          onBack={() => setView({ name: 'list' })}
        />
      )}

      <footer className="app-footer">{t('app.version', { version: __APP_VERSION__ })}</footer>
    </div>
  );
}

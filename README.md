# ComicVault

Osebna aplikacija za dokumentiranje zbirke stripov — dodajanje, urejanje, brisanje, iskanje in izvoz (JSON / CSV / PDF). Deluje popolnoma v brskalniku, brez strežniškega dela baze.

## Kako deluje shranjevanje podatkov

Vercel je brezstrežniško okolje (datotečni sistem ni trajen med zahtevami/deployi), zato ta aplikacija baze **ne** hrani na strežniku. Namesto tega:

- V **Chrome/Edge** aplikacija uporablja [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) + [`sql.js`](https://sql.js.org/) (SQLite prevedena v WebAssembly), tako da dejansko bereš/pišeš pravo `.sqlite` datoteko na svojem disku. Izbrana datoteka (bolje rečeno njen "handle") se zapomni preko IndexedDB, zato ob naslednjem obisku ni treba znova izbirati datoteke.
- V **Firefox/Safari**, ki File System Access API ne podpirata, aplikacija samodejno preklopi na navadno **IndexedDB** shrambo znotraj brskalnika. Podatki ostanejo, dokler ne počistiš podatkov brskalnika; za prenos na drugo napravo uporabi JSON izvoz/uvoz.

Ta preklop je implementiran v `src/db/storageAdapter.js`, ki izbere pravi "adapter" (`sqliteAdapter.js` ali `indexedDbAdapter.js`) glede na podporo brskalnika. Komponente v `src/components/` komunicirajo samo s tem enotnim vmesnikom — če bi kdaj želel dodati sinhronizacijo preko oddaljene baze (npr. Turso/libSQL), zadostuje nov adapter, brez posegov v UI.

## Zagon lokalno

```bash
npm install
npm run dev
```

## Objava na GitHub + Vercel

1. Ustvari prazen repozitorij `comicvault` na GitHubu.
2. V tej mapi:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<tvoj-username>/comicvault.git
   git push -u origin main
   ```
3. Na [vercel.com](https://vercel.com) izberi "Add New Project" → poveži svoj GitHub račun → izberi repozitorij `comicvault`.
4. Vercel samodejno prepozna Vite projekt (build ukaz `npm run build`, izhodna mapa `dist`) — ni potrebna dodatna konfiguracija. Klikni "Deploy".
5. Ob vsakem `git push` na `main` Vercel samodejno zgradi in objavi novo verzijo.

## Dodajanje novega polja

Vsa polja stripa so definirana na enem mestu: `src/db/schema.js` (`COMIC_FIELDS`). Dodaj nov vnos v ta seznam (key, type, group) — obrazec, SQLite shema in izvozi (CSV, PDF checklist) ga samodejno upoštevajo. Ne pozabi dodati prevoda ključa `fields.<key>` v `src/i18n/sl.json` in `src/i18n/en.json`.

## Dodajanje novega jezika

1. Ustvari `src/i18n/xx.json` s popolnoma enakimi ključi kot `sl.json`/`en.json`.
2. V `src/i18n/index.jsx` uvozi datoteko in dodaj vrstico v seznam `LANGUAGES`.

Nič drugje v kodi ni treba spreminjati — noben tekst ni trdo kodiran v komponentah.

## Struktura projekta

```
src/
├── components/     UI komponente (seznam, obrazec, detajl, orodna vrstica)
├── db/             shema podatkov + storage adapterji (sqlite/indexeddb)
├── export/         izvoz v JSON, CSV, PDF
├── i18n/           prevodi (sl/en) + React context
├── styles/         CSS spremenljivke (light/dark) + ThemeContext
├── App.jsx         glavna komponenta, upravljanje pogledov
└── main.jsx        vstopna točka
```

## Verzioniranje in changelog

Projekt sledi [semantičnemu verzioniranju](https://semver.org/lang/sl/) (`MAJOR.MINOR.PATCH`), zapisanemu v `package.json`. Vsaka izdaja je zabeležena v [`CHANGELOG.md`](./CHANGELOG.md) po formatu [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Verzija iz `package.json` se samodejno prikaže tudi v nogi aplikacije (`vite.config.js` jo ob buildu vgradi kot `__APP_VERSION__`) — številke ni treba ročno usklajevati na dveh mestih.

Ob vsaki vsebinsko pomembnejši spremembi:

1. Med delom sproti dodajaj vrstice pod `## [Unreleased]` v `CHANGELOG.md`.
2. Ko si pripravljen na izdajo, popravi verzijo v `package.json` (npr. `0.1.0` → `0.2.0` za novo funkcionalnost, `0.1.1` za popravek napake).
3. V `CHANGELOG.md` preimenuj `[Unreleased]` v novo verzijo z datumom, npr. `## [0.2.0] - 2026-10-03`, in nad njim dodaj prazen `## [Unreleased]` za naprej.
4. Commitaj in označi izdajo z Git tagom:
   ```bash
   git add .
   git commit -m "Release v0.2.0"
   git tag v0.2.0
   git push && git push --tags
   ```
5. Na GitHubu lahko iz tega taga ustvariš tudi "Release" (Releases → Draft a new release), z opisom, prekopiranim iz changeloga. Vercel take tage ne potrebuje — vsak push na `main` proži svoj deploy ne glede na verzijo.

Kdaj katero številko dvigniti:
- **PATCH** (0.1.**1**) — popravek napake, brez spremembe funkcionalnosti
- **MINOR** (0.**2**.0) — novo polje, nov izvoz, nova funkcionalnost, ki ne podre obstoječih podatkov
- **MAJOR** (**1**.0.0) — sprememba, ki zahteva ročno migracijo obstoječe `.sqlite` datoteke ali podre združljivost s starimi izvozi

## Slike naslovnic

Telefonske fotografije so pogosto 4-7 MB — pri nekaj sto stripih (naslovnica + zadnja stran) bi to bazo napihnilo na več GB, kar je za `sql.js` (celotna baza se drži v pomnilniku brskalnika in se ob vsakem shranjevanju v celoti prepiše) tako počasno kot tvegano. Zato se vsaka naložena slika v `src/utils/image.js` samodejno pomanjša na največ 1400 px na daljši stranici in stisne kot JPEG (kakovost 0.82) — tipičen rezultat je 150-400 KB na sliko, brez opazne izgube kakovosti na zaslonu ali v PDF izvozu. Če želiš drugačno razmerje med kakovostjo in velikostjo, spremeni `DEFAULT_MAX_DIMENSION`/`DEFAULT_QUALITY` v tej datoteki.

## Znane omejitve

- File System Access API trenutno podpirata le Chrome in Edge (in izpeljanke na osnovi Chromium-a). Firefox in Safari uporabljata IndexedDB brez datoteke na disku.
- Sinhronizacija med napravami ni vgrajena — priporočen način je JSON izvoz/uvoz, ali hranjenje `.sqlite` datoteke v mapi, ki jo sinhronizira Dropbox/Google Drive/OneDrive.

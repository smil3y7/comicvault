# Changelog

Vse pomembnejše spremembe v tem projektu so zabeležene v tej datoteki.

Format temelji na [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
projekt pa sledi [semantičnemu verzioniranju](https://semver.org/lang/sl/)
(MAJOR.MINOR.PATCH).

## [Unreleased]

## [0.2.0] - 2026-09-25

### Added
- Slike naslovnice in zadnje strani se pred shranjevanjem samodejno pomanjšajo
  (največ 1400 px na daljši stranici) in stisnejo kot JPEG, da telefonske
  fotografije (tipično 4-7 MB) ne napihnejo baze pri večjem številu stripov.

## [0.1.0] - 2026-09-25

### Added
- Prva verzija aplikacije: dodajanje, urejanje, brisanje in pregled stripov.
- Polja: naslov, serija, številka, založnik, datum izida, scenarist, risar,
  variant naslovnice, jezik izdaje, ISBN/črtna koda, stanje, nabavna cena,
  ocenjena vrednost, datum in vir nakupa, lokacija shranjevanja, prebrano,
  priljubljeno, opombe, naslovnica in zadnja stran (slika).
- Shramba: SQLite v brskalniku (`sql.js`) + File System Access API za
  shranjevanje na pravo `.sqlite` datoteko na disku (Chrome/Edge), s
  samodejnim fallbackom na IndexedDB (Firefox/Safari).
- Izvoz zbirke v JSON (poln backup s slikami), CSV (tabela) in PDF
  (kompakten checklist ter vizualni katalog z naslovnicami).
- Iskanje po naslovu, seriji, avtorju in založniku; razvrščanje po seriji,
  naslovu, vrednosti ali datumu nakupa.
- Dvojezičen vmesnik (slovenščina/angleščina) preko i18n sistema, brez
  trdo kodiranega besedila.
- Light/dark način, z zaznavo sistemske nastavitve in ročnim preklopom.

[Unreleased]: https://github.com/<tvoj-username>/comicvault/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/<tvoj-username>/comicvault/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/<tvoj-username>/comicvault/releases/tag/v0.1.0

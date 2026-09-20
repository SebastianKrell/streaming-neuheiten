import type { Language } from './types';

export const TEXT = {
  de: {
    light: 'Hell',
    dark: 'Dunkel',
    colorScheme: 'Farbschema',
    language: 'Sprache',
    siteTitle: 'STREAMING-NEUHEITEN',
    heroTitle: (
      <>
        Was ist neu
        <br />
        im Abo?
      </>
    ),
    heroCopy:
      'Alle Filme und Serien, die im gewählten Monat neu zu Netflix, Disney+, Prime Video und RTL+ dazugekommen sind – für Deutschland.',
    previousMonth: 'Vorheriger Monat',
    nextMonth: 'Nächster Monat',
    selectMonth: 'Monat auswählen',
    providers: 'Anbieter',
    type: 'Art',
    all: 'Alle',
    movies: 'Filme',
    series: 'Serien',
    sortBy: 'Sortierung',
    sortDate: 'Nach Datum',
    sortTitle: 'Nach Titel',
    sortRating: 'Nach Bewertung',
    sortDirection: 'Sortierreihenfolge',
    ascending: 'Aufsteigend',
    descending: 'Absteigend',
    genres: 'Genre',
    allGenres: 'Alle',
    resetGenres: 'Auswahl zurücksetzen',
    display: 'Anzeige',
    descriptions: 'Beschreibungen',
    titleCount: (count: number) => `${count} ${count === 1 ? 'Titel' : 'Titel'}`,
    addedOn: (date: string) => `seit ${date}`,
    comingOn: (date: string) => `ab ${date}`,
    announced: 'Angekündigt',
    movie: 'Film',
    seriesSingular: 'Serie',
    watchOn: (provider: string) => `Bei ${provider} ansehen`,
    emptyMonth: 'Für diesen Monat sind keine Titel erfasst.',
    emptyFiltered: 'Keine Titel passen zu den gewählten Filtern.',
    beforeArchive:
      'Dieser Monat liegt vor dem Start der Datensammlung. Die Schnittstelle liefert Katalogänderungen nur 31 Tage rückwärts, ältere Monate lassen sich deshalb nicht nachtragen.',
    loading: 'Daten werden geladen …',
    loadError: 'Die Daten konnten nicht geladen werden.',
    updatedAt: (date: string) => `Zuletzt aktualisiert: ${date}`,
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    dataCredit: 'Daten: Streaming Availability API.',
    disclaimer:
      'Inoffizielles Projekt. Netflix, Disney+, Prime Video und RTL+ sowie alle Titel und Marken sind Eigentum ihrer jeweiligen Rechteinhaber.',
  },
  en: {
    light: 'Light',
    dark: 'Dark',
    colorScheme: 'Color scheme',
    language: 'Language',
    siteTitle: 'STREAMING-NEUHEITEN',
    heroTitle: (
      <>
        What is new
        <br />
        this month?
      </>
    ),
    heroCopy:
      'Every film and series added to Netflix, Disney+, Prime Video and RTL+ in the selected month – for Germany.',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    selectMonth: 'Select month',
    providers: 'Services',
    type: 'Type',
    all: 'All',
    movies: 'Movies',
    series: 'Series',
    sortBy: 'Sort',
    sortDate: 'By date',
    sortTitle: 'By title',
    sortRating: 'By rating',
    sortDirection: 'Sort direction',
    ascending: 'Ascending',
    descending: 'Descending',
    genres: 'Genre',
    allGenres: 'All',
    resetGenres: 'Clear selection',
    display: 'Display',
    descriptions: 'Descriptions',
    titleCount: (count: number) => `${count} ${count === 1 ? 'title' : 'titles'}`,
    addedOn: (date: string) => `since ${date}`,
    comingOn: (date: string) => `from ${date}`,
    announced: 'Announced',
    movie: 'Movie',
    seriesSingular: 'Series',
    watchOn: (provider: string) => `Watch on ${provider}`,
    emptyMonth: 'No titles recorded for this month.',
    emptyFiltered: 'No titles match the selected filters.',
    beforeArchive:
      'This month predates the start of data collection. The source API only exposes catalogue changes 31 days back, so earlier months cannot be filled in.',
    loading: 'Loading data …',
    loadError: 'The data could not be loaded.',
    updatedAt: (date: string) => `Last updated: ${date}`,
    imprint: 'Legal notice',
    privacy: 'Privacy',
    dataCredit: 'Data: Streaming Availability API.',
    disclaimer:
      'Unofficial project. Netflix, Disney+, Prime Video and RTL+ as well as all titles and trademarks belong to their respective owners.',
  },
} as const;

export type Labels = (typeof TEXT)[Language];

const MONTH_FORMATTERS: Record<Language, Intl.DateTimeFormat> = {
  de: new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  en: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
};

const DAY_FORMATTERS: Record<Language, Intl.DateTimeFormat> = {
  de: new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
  en: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
};

/** `2026-09` → `September 2026`. */
export function formatMonth(month: string, language: Language): string {
  return MONTH_FORMATTERS[language].format(new Date(`${month}-01T00:00:00Z`));
}

/** `2026-09-03` → `03.09.`. */
export function formatDay(date: string, language: Language): string {
  return DAY_FORMATTERS[language].format(new Date(`${date}T00:00:00Z`));
}

export function formatTimestamp(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

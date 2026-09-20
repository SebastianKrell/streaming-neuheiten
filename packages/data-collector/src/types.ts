/**
 * Die Anbieter, die wir zeigen. Schlüssel = `serviceId` der Streaming Availability
 * API; die Katalog-IDs für `catalogs` entstehen daraus mit dem Zusatz
 * `.subscription`. Welche Dienste es für Deutschland gibt, zeigt
 * `npm run services`.
 */
export const PROVIDERS = ['netflix', 'disney', 'prime', 'rtl'] as const;
export type Provider = (typeof PROVIDERS)[number];

export type ShowType = 'movie' | 'series';
export type Language = 'de' | 'en';

export type Localized = Record<Language, string>;

/** Ein Katalog-Neuzugang, so wie ihn das Frontend liest. */
export interface Entry {
  /** Interne ID der Streaming Availability API. */
  showId: string;
  imdbId: string | null;
  provider: Provider;
  showType: ShowType;
  /** Tag des Katalog-Zugangs als `YYYY-MM-DD` (Europe/Berlin). */
  addedAt: string;
  /** true = angekündigt, kommt erst noch dazu. */
  upcoming: boolean;
  /** Deeplink zum Titel beim Anbieter. */
  link: string | null;
  title: Localized;
  overview: Localized;
  releaseYear: number | null;
  genres: Localized[];
  /** 0–100, wie von der Streaming Availability API geliefert. */
  rating: number | null;
}

export interface MonthFile {
  month: string;
  generatedAt: string;
  entries: Entry[];
}

export interface IndexFile {
  generatedAt: string;
  /**
   * Ende des zuletzt erfolgreich abgefragten Zeitfensters. Daraus leitet der
   * nächste Lauf sein `from` ab, damit zwischen zwei Läufen keine Lücke
   * entsteht, auch wenn der Cron-Job mal ausfällt.
   */
  lastCollectedAt: string;
  /** Absteigend sortiert, neuester Monat zuerst. */
  months: MonthSummary[];
  /** Frühester Monat, für den überhaupt Daten gesammelt wurden. */
  archiveStart: string;
}

export interface MonthSummary {
  month: string;
  total: number;
  /** Anzahl Einträge je Anbieter, für die Badges in der Monatsauswahl. */
  byProvider: Record<Provider, number>;
}

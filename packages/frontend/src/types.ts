export const PROVIDERS = ['netflix', 'disney', 'prime', 'rtl'] as const;
export type Provider = (typeof PROVIDERS)[number];

export type ShowType = 'movie' | 'series';
export type Language = 'de' | 'en';

export type Localized = Record<Language, string>;

export interface Entry {
  showId: string;
  imdbId: string | null;
  provider: Provider;
  showType: ShowType;
  addedAt: string;
  upcoming: boolean;
  link: string | null;
  title: Localized;
  overview: Localized;
  releaseYear: number | null;
  genres: Localized[];
  rating: number | null;
}

export interface MonthFile {
  month: string;
  generatedAt: string;
  entries: Entry[];
}

export interface MonthSummary {
  month: string;
  total: number;
  byProvider: Record<Provider, number>;
}

export interface IndexFile {
  generatedAt: string;
  lastCollectedAt: string;
  months: MonthSummary[];
  archiveStart: string;
}

export const PROVIDER_LABELS: Record<Provider, string> = {
  netflix: 'Netflix',
  disney: 'Disney+',
  prime: 'Prime Video',
  rtl: 'RTL+',
};

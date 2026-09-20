import { PROVIDERS } from './types.js';

const BASE_URL = 'https://api.movieofthenight.com/v4';
/** Die API liefert 25 Änderungen je Seite; 100 Seiten decken auch ein volles Nachholfenster. */
const MAX_PAGES = 100;

/** Nur die Felder, die wir tatsächlich auswerten – die API liefert deutlich mehr. */
export interface RawChange {
  changeType: string;
  itemType: string;
  showId: string;
  showType: string;
  service?: { id?: string };
  streamingOptionType?: string;
  timestamp?: number | null;
  link?: string | null;
}

export interface RawShow {
  id: string;
  imdbId?: string | null;
  showType?: string;
  title?: string;
  originalTitle?: string;
  overview?: string;
  releaseYear?: number | null;
  firstAirYear?: number | null;
  rating?: number | null;
  genres?: { id?: string | number; name?: string }[];
}

interface ChangesResponse {
  changes?: RawChange[];
  shows?: Record<string, RawShow>;
  hasMore?: boolean;
  nextCursor?: string | null;
}

export interface ChangesResult {
  changes: RawChange[];
  shows: Map<string, RawShow>;
  /** true, wenn das Seitenlimit griff und noch Daten offen sind. */
  truncated: boolean;
}

export type ChangeType = 'new' | 'upcoming';

interface FetchOptions {
  apiKey: string;
  changeType: ChangeType;
  /** Unix-Sekunden, inklusiv. */
  from: number;
  /** Unix-Sekunden, inklusiv. */
  to: number;
  outputLanguage: string;
}

/**
 * Holt Katalog-Änderungen für Deutschland über alle Cursor-Seiten hinweg.
 * Das Zeitfenster der API reicht nur ±31 Tage; längere Bereiche liefern
 * stillschweigend weniger Daten, deshalb prüft der Aufrufer das Fenster.
 */
export async function fetchChanges({
  apiKey,
  changeType,
  from,
  to,
  outputLanguage,
}: FetchOptions): Promise<ChangesResult> {
  const changes: RawChange[] = [];
  const shows = new Map<string, RawShow>();
  let cursor: string | null = null;
  let page = 0;
  let truncated = false;

  do {
    const url = new URL(`${BASE_URL}/changes`);
    url.searchParams.set('country', 'de');
    url.searchParams.set('change_type', changeType);
    url.searchParams.set('item_type', 'show');
    url.searchParams.set('catalogs', PROVIDERS.join(','));
    url.searchParams.set('from', String(from));
    url.searchParams.set('to', String(to));
    url.searchParams.set('output_language', outputLanguage);
    url.searchParams.set('order_direction', 'asc');
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url, { headers: { 'X-API-Key': apiKey } });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Streaming Availability API antwortete mit ${response.status} ${response.statusText}` +
          (body ? `: ${body.slice(0, 300)}` : ''),
      );
    }

    const payload = (await response.json()) as ChangesResponse;
    changes.push(...(payload.changes ?? []));
    for (const [id, show] of Object.entries(payload.shows ?? {})) shows.set(id, show);

    cursor = payload.hasMore ? (payload.nextCursor ?? null) : null;
    page += 1;
    // Reißleine gegen einen kaputten Cursor: die Free-Tier-Quote liegt bei
    // 1.000 Requests im Monat, die wollen wir nicht in einem Lauf verbrennen.
    // Der Aufrufer wertet `truncated` aus und merkt sich, bis wohin er kam –
    // sonst würden die offenen Tage stillschweigend übersprungen.
    if (cursor && page >= MAX_PAGES) {
      console.warn(
        `[${changeType}/${outputLanguage}] Seitenlimit ${MAX_PAGES} erreicht, ` +
          `${changes.length} Änderungen geholt – Rest folgt im nächsten Lauf.`,
      );
      truncated = true;
      break;
    }
  } while (cursor);

  return { changes, shows, truncated };
}

import {
  listArchivedMonths,
  mergeEntries,
  readIndex,
  readMonth,
  summarize,
  writeIndex,
  writeMonth,
} from './archive.js';
import { loadDotEnv, requireEnv } from './env.js';
import { fetchChanges, type ChangeType, type RawChange, type RawShow } from './streamingAvailability.js';
import { PROVIDERS, type Entry, type Provider, type ShowType } from './types.js';

/** Die API liefert höchstens 31 Tage rückwärts bzw. vorwärts. */
const WINDOW_DAYS = 31;
/**
 * Abstand zum harten 31-Tage-Limit. Die API prüft es beim Eintreffen des
 * Requests, nicht beim Berechnen des Fensters – ohne Puffer scheitert schon
 * der zweite Aufruf eines Laufs mit "cannot be more than 31 days in the past".
 */
const WINDOW_SAFETY_MS = 10 * 60 * 1000;
/** Kulanz, weil Anbieter Zugänge gelegentlich mit Verzögerung melden. */
const GRACE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Nur echte Abo-Inhalte – Kauf, Leihe und Zusatzkanäle sind kein Katalog-Zugang. */
const RELEVANT_OPTION_TYPES = new Set(['subscription', 'free']);

const BERLIN_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Unix-Sekunden → `YYYY-MM-DD` in deutscher Zeitzone. */
function toBerlinDate(unixSeconds: number): string {
  return BERLIN_DATE.format(new Date(unixSeconds * 1000));
}

function isProvider(value: string | undefined): value is Provider {
  return PROVIDERS.includes(value as Provider);
}

function toShowType(value: string | undefined): ShowType {
  return value === 'series' ? 'series' : 'movie';
}

function toEntry(change: RawChange, show: RawShow | undefined, upcoming: boolean): Entry | null {
  const provider = change.service?.id;
  if (!isProvider(provider)) return null;
  if (change.itemType !== 'show') return null;
  if (!RELEVANT_OPTION_TYPES.has(change.streamingOptionType ?? '')) return null;
  // Ohne Zeitstempel lässt sich der Eintrag keinem Monat zuordnen.
  if (typeof change.timestamp !== 'number') return null;

  const title = show?.title ?? show?.originalTitle ?? '';
  if (!title) return null;

  const overview = show?.overview ?? '';

  return {
    showId: change.showId,
    imdbId: show?.imdbId ?? null,
    provider,
    showType: toShowType(change.showType ?? show?.showType),
    addedAt: toBerlinDate(change.timestamp),
    upcoming,
    link: change.link ?? null,
    // Wird vom englischen Durchlauf überschrieben, siehe applyEnglish().
    title: { de: title, en: title },
    overview: { de: overview, en: overview },
    releaseYear: show?.releaseYear ?? show?.firstAirYear ?? null,
    genres: (show?.genres ?? [])
      .map((genre) => genre.name)
      .filter((name): name is string => Boolean(name))
      .map((name) => ({ de: name, en: name })),
    rating: show?.rating ?? null,
  };
}

/**
 * Übernimmt Titel, Beschreibung und Genres aus dem englischen Durchlauf.
 * Die API übersetzt dieselben Shows, die Reihenfolge der Genres ist dabei
 * stabil – deshalb reicht der Abgleich über die Show-ID.
 */
function applyEnglish(entries: Entry[], shows: Map<string, RawShow>): void {
  let translated = 0;
  for (const entry of entries) {
    const show = shows.get(entry.showId);
    if (!show) continue;
    const title = show.title ?? show.originalTitle;
    if (title) entry.title.en = title;
    if (show.overview) entry.overview.en = show.overview;
    const genres = (show.genres ?? [])
      .map((genre) => genre.name)
      .filter((name): name is string => Boolean(name));
    if (genres.length === entry.genres.length) {
      entry.genres = entry.genres.map((genre, index) => ({ de: genre.de, en: genres[index]! }));
    }
    translated += 1;
  }
  console.log(`[en] ${translated} von ${entries.length} Einträgen übersetzt`);
}

async function collect(
  apiKey: string,
  changeType: ChangeType,
  from: number,
  to: number,
  outputLanguage: string,
): Promise<{ entries: Entry[]; shows: Map<string, RawShow> }> {
  const { changes, shows } = await fetchChanges({ apiKey, changeType, from, to, outputLanguage });

  const entries = changes
    .map((change) => toEntry(change, shows.get(change.showId), changeType === 'upcoming'))
    .filter((entry): entry is Entry => entry !== null);

  console.log(
    `[${changeType}/${outputLanguage}] ${changes.length} Änderungen, davon ${entries.length} relevant`,
  );
  return { entries, shows };
}

async function main(): Promise<void> {
  loadDotEnv();
  const apiKey = requireEnv('STREAMING_API_KEY');

  const now = Date.now();
  const previousIndex = await readIndex();
  const lastCollected = previousIndex?.lastCollectedAt
    ? new Date(previousIndex.lastCollectedAt).getTime()
    : Number.NaN;

  const earliest = now - WINDOW_DAYS * DAY_MS + WINDOW_SAFETY_MS;
  const desiredFrom = Number.isNaN(lastCollected) ? earliest : lastCollected - GRACE_DAYS * DAY_MS;
  const from = Math.floor(Math.max(desiredFrom, earliest) / 1000);
  const to = Math.floor(now / 1000);
  const upcomingTo = Math.floor((now + WINDOW_DAYS * DAY_MS - WINDOW_SAFETY_MS) / 1000);

  console.log(
    `Zeitfenster: ${new Date(from * 1000).toISOString()} bis ${new Date(to * 1000).toISOString()}`,
  );

  const fresh: Entry[] = [];
  const confirmed = await collect(apiKey, 'new', from, to, 'de');
  fresh.push(...confirmed.entries);

  try {
    const announced = await collect(apiKey, 'upcoming', to, upcomingTo, 'de');
    fresh.push(...announced.entries);
  } catch (error) {
    // Ankündigungen sind Beiwerk – der Lauf soll daran nicht scheitern.
    console.warn(
      '[upcoming] Abruf fehlgeschlagen, fahre nur mit bestätigten Zugängen fort:',
      error instanceof Error ? error.message : error,
    );
  }

  // Zweiter Durchlauf nur für die englischen Texte. Schlägt er fehl, bleibt
  // die deutsche Fassung stehen – besser als ein abgebrochener Lauf.
  try {
    const english = new Map<string, RawShow>();
    for (const changeType of ['new', 'upcoming'] as ChangeType[]) {
      const window = changeType === 'new' ? [from, to] : [to, upcomingTo];
      const result = await fetchChanges({
        apiKey,
        changeType,
        from: window[0]!,
        to: window[1]!,
        outputLanguage: 'en',
      });
      for (const [id, show] of result.shows) english.set(id, show);
    }
    applyEnglish(fresh, english);
  } catch (error) {
    console.warn(
      '[en] Englische Texte konnten nicht geholt werden, verwende die deutschen:',
      error instanceof Error ? error.message : error,
    );
  }

  const byMonth = new Map<string, Entry[]>();
  for (const entry of fresh) {
    const month = entry.addedAt.slice(0, 7);
    const list = byMonth.get(month) ?? [];
    list.push(entry);
    byMonth.set(month, list);
  }

  const generatedAt = new Date(now).toISOString();
  for (const [month, entries] of byMonth) {
    const previous = (await readMonth(month))?.entries ?? [];
    const merged = mergeEntries(previous, entries);
    await writeMonth(month, merged, generatedAt);
    console.log(`[${month}] ${merged.length} Einträge (${merged.length - previous.length} neu)`);
  }

  // Der Index listet alle Monate im Archiv, nicht nur die gerade berührten.
  const summaries = [];
  for (const month of await listArchivedMonths()) {
    const file = await readMonth(month);
    if (file) summaries.push(summarize(month, file.entries));
  }
  await writeIndex(summaries, generatedAt, generatedAt);
  console.log(`Index geschrieben: ${summaries.length} Monate im Archiv`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

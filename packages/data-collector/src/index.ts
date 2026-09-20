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
import { PROVIDERS, type Entry, type Localized, type Provider, type ShowType } from './types.js';

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

/**
 * Nur echte Abo-Inhalte – Kauf, Leihe und Zusatzkanäle sind kein Katalog-Zugang.
 * Die API filtert das über die `.subscription`-Kataloge bereits mit; dieser
 * Check bleibt als Absicherung, falls die Abfrage je erweitert wird.
 */
const RELEVANT_OPTION_TYPES = new Set(['subscription']);

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

/**
 * Führt die Genres beider Sprachdurchläufe zusammen. Über die Position geht
 * das nicht: die API sortiert Genres je Sprache alphabetisch, „Comedy,
 * Fantasy" wird im Deutschen zu „Fantasy, Komödie". Maßgeblich ist die ID.
 */
function mergeGenres(de: RawShow | undefined, en: RawShow | undefined): Localized[] {
  const englishById = new Map(
    (en?.genres ?? [])
      .filter((genre) => genre.id !== undefined && genre.name)
      .map((genre) => [String(genre.id), genre.name!]),
  );

  const source = de?.genres?.length ? de.genres : (en?.genres ?? []);
  return source
    .filter((genre) => Boolean(genre.name))
    .map((genre) => {
      const english = genre.id === undefined ? undefined : englishById.get(String(genre.id));
      return { de: genre.name!, en: english ?? genre.name! };
    });
}

function toEntry(
  change: RawChange,
  show: RawShow | undefined,
  english: RawShow | undefined,
  upcoming: boolean,
): Entry | null {
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
    title: { de: title, en: english?.title ?? english?.originalTitle ?? title },
    overview: { de: overview, en: english?.overview || overview },
    releaseYear: show?.releaseYear ?? show?.firstAirYear ?? null,
    genres: mergeGenres(show, english),
    // Unbewertete Titel kommen mit 0 statt null – sonst stünde überall "0.0".
    rating: typeof show?.rating === 'number' && show.rating > 0 ? show.rating : null,
  };
}

interface CollectResult {
  entries: Entry[];
  truncated: boolean;
  /** Neuester Zeitstempel unter den geholten Änderungen, in Unix-Sekunden. */
  latestTimestamp: number | null;
}

/**
 * Holt einen Änderungstyp in beiden Sprachen und baut daraus die Einträge.
 * Der englische Durchlauf dient nur als Übersetzungsquelle; schlägt er fehl,
 * bleiben die deutschen Texte stehen statt den ganzen Lauf abzubrechen.
 */
async function collect(
  apiKey: string,
  changeType: ChangeType,
  from: number,
  to: number,
): Promise<CollectResult> {
  const german = await fetchChanges({ apiKey, changeType, from, to, outputLanguage: 'de' });

  let english = new Map<string, RawShow>();
  try {
    english = (await fetchChanges({ apiKey, changeType, from, to, outputLanguage: 'en' })).shows;
  } catch (error) {
    console.warn(
      `[${changeType}/en] Englische Texte nicht verfügbar, verwende die deutschen:`,
      error instanceof Error ? error.message : error,
    );
  }

  const entries = german.changes
    .map((change) =>
      toEntry(change, german.shows.get(change.showId), english.get(change.showId), changeType === 'upcoming'),
    )
    .filter((entry): entry is Entry => entry !== null);

  const timestamps = german.changes
    .map((change) => change.timestamp)
    .filter((value): value is number => typeof value === 'number');

  console.log(
    `[${changeType}] ${german.changes.length} Änderungen, davon ${entries.length} relevant`,
  );

  return {
    entries,
    truncated: german.truncated,
    latestTimestamp: timestamps.length ? Math.max(...timestamps) : null,
  };
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
  const confirmed = await collect(apiKey, 'new', from, to);
  fresh.push(...confirmed.entries);

  try {
    const announced = await collect(apiKey, 'upcoming', to, upcomingTo);
    fresh.push(...announced.entries);
  } catch (error) {
    // Ankündigungen sind Beiwerk – der Lauf soll daran nicht scheitern.
    console.warn(
      '[upcoming] Abruf fehlgeschlagen, fahre nur mit bestätigten Zugängen fort:',
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

  // Nur bis dahin fortschreiben, wo wir wirklich waren. Nach einem Abbruch am
  // Seitenlimit würde `now` die offenen Tage dauerhaft überspringen; mit dem
  // letzten tatsächlich geholten Zeitstempel arbeitet sich der nächste Lauf
  // weiter vor, bis das Archiv aufgeholt hat.
  const collectedThrough =
    confirmed.truncated && confirmed.latestTimestamp !== null
      ? new Date(confirmed.latestTimestamp * 1000).toISOString()
      : generatedAt;
  if (confirmed.truncated) {
    console.warn(`Unvollständiger Lauf – nächster Lauf setzt bei ${collectedThrough} an.`);
  }

  // Der Index listet alle Monate im Archiv, nicht nur die gerade berührten.
  const summaries = [];
  for (const month of await listArchivedMonths()) {
    const file = await readMonth(month);
    if (file) summaries.push(summarize(month, file.entries));
  }
  await writeIndex(summaries, generatedAt, collectedThrough);
  console.log(`Index geschrieben: ${summaries.length} Monate im Archiv`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

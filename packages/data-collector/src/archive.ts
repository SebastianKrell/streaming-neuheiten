import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVIDERS, type Entry, type IndexFile, type MonthFile, type MonthSummary, type Provider } from './types.js';

const here = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = resolve(here, '../../frontend/public/data');
export const MONTHS_DIR = resolve(DATA_DIR, 'months');
export const INDEX_PATH = resolve(DATA_DIR, 'index.json');

const MONTH_FILE_PATTERN = /^(\d{4}-\d{2})\.json$/;

export function monthPath(month: string): string {
  return resolve(MONTHS_DIR, `${month}.json`);
}

export async function readIndex(): Promise<IndexFile | null> {
  try {
    return JSON.parse(await readFile(INDEX_PATH, 'utf-8')) as IndexFile;
  } catch {
    return null;
  }
}

export async function readMonth(month: string): Promise<MonthFile | null> {
  try {
    return JSON.parse(await readFile(monthPath(month), 'utf-8')) as MonthFile;
  } catch {
    return null;
  }
}

export async function listArchivedMonths(): Promise<string[]> {
  try {
    const files = await readdir(MONTHS_DIR);
    return files
      .map((file) => MONTH_FILE_PATTERN.exec(file)?.[1])
      .filter((month): month is string => Boolean(month))
      .sort();
  } catch {
    return [];
  }
}

/** Ein Eintrag ist eindeutig über Titel + Anbieter innerhalb eines Monats. */
function entryKey(entry: Entry): string {
  return `${entry.showId}::${entry.provider}`;
}

/**
 * Führt neue Einträge in einen bestehenden Monat ein. Bestehende Einträge
 * bleiben erhalten – die API meldet einen Zugang nur einmal, ein späterer
 * Lauf darf ihn also nicht verlieren. Ein angekündigter Eintrag (`upcoming`)
 * wird durch die spätere echte Meldung ersetzt.
 */
export function mergeEntries(previous: Entry[], incoming: Entry[]): Entry[] {
  const merged = new Map<string, Entry>();
  for (const entry of previous) merged.set(entryKey(entry), entry);

  for (const entry of incoming) {
    const key = entryKey(entry);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, entry);
      continue;
    }
    // Bestätigter Zugang schlägt Ankündigung; ansonsten die reichere Version behalten.
    const preferIncoming = existing.upcoming && !entry.upcoming;
    merged.set(key, preferIncoming ? { ...existing, ...entry } : fillGaps(existing, entry));
  }

  return [...merged.values()].sort(
    (a, b) => a.addedAt.localeCompare(b.addedAt) || a.title.de.localeCompare(b.title.de, 'de'),
  );
}

/** Füllt leere Felder eines bestehenden Eintrags aus einem neuen auf. */
function fillGaps(existing: Entry, incoming: Entry): Entry {
  return {
    ...existing,
    imdbId: existing.imdbId ?? incoming.imdbId,
    link: existing.link ?? incoming.link,
    releaseYear: existing.releaseYear ?? incoming.releaseYear,
    rating: existing.rating ?? incoming.rating,
    genres: existing.genres.length ? existing.genres : incoming.genres,
  };
}

export async function writeMonth(month: string, entries: Entry[], generatedAt: string): Promise<void> {
  const file: MonthFile = { month, generatedAt, entries };
  await mkdir(MONTHS_DIR, { recursive: true });
  await writeFile(monthPath(month), `${JSON.stringify(file, null, 2)}\n`, 'utf-8');
}

export function summarize(month: string, entries: Entry[]): MonthSummary {
  const byProvider = Object.fromEntries(PROVIDERS.map((provider) => [provider, 0])) as Record<
    Provider,
    number
  >;
  for (const entry of entries) byProvider[entry.provider] += 1;
  return { month, total: entries.length, byProvider };
}

export async function writeIndex(
  summaries: MonthSummary[],
  generatedAt: string,
  lastCollectedAt: string,
): Promise<void> {
  const months = [...summaries].sort((a, b) => b.month.localeCompare(a.month));
  const index: IndexFile = {
    generatedAt,
    lastCollectedAt,
    months,
    archiveStart: months.at(-1)?.month ?? generatedAt.slice(0, 7),
  };
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`, 'utf-8');
}

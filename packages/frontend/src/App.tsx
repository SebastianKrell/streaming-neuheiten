import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MonthPicker } from './components/MonthPicker';
import { ProviderFilter } from './components/ProviderFilter';
import { SiteHeader } from './components/SiteHeader';
import { TitleCard } from './components/TitleCard';
import { TEXT, formatMonth, formatTimestamp } from './i18n';
import {
  PROVIDERS,
  type Entry,
  type IndexFile,
  type Language,
  type MonthFile,
  type Provider,
} from './types';

type Theme = 'light' | 'dark';
type TypeFilter = 'all' | 'movie' | 'series';
type SortKey = 'date' | 'title' | 'rating';

const BASE = import.meta.env.BASE_URL;

function currentMonth(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
}

function shiftMonth(month: string, offset: number): string {
  const [year, index] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year!, index! - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Lückenlose Monatsliste von `from` bis `to`, damit die Pfeil-Navigation nichts überspringt. */
function monthRange(from: string, to: string): string[] {
  const months: string[] = [];
  let cursor = from;
  while (cursor <= to && months.length < 600) {
    months.push(cursor);
    cursor = shiftMonth(cursor, 1);
  }
  return months;
}

function readParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function parseProviders(value: string | null): Provider[] {
  if (!value) return [...PROVIDERS];
  const selected = value.split(',').filter((item): item is Provider => PROVIDERS.includes(item as Provider));
  return selected.length ? selected : [...PROVIDERS];
}

export function App() {
  const params = useRef(readParams()).current;

  const [language, setLanguage] = useState<Language>(() => {
    const fromUrl = params.get('lang');
    if (fromUrl === 'de' || fromUrl === 'en') return fromUrl;
    const stored = localStorage.getItem('language');
    if (stored === 'de' || stored === 'en') return stored;
    return navigator.language.startsWith('de') ? 'de' : 'en';
  });
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.getAttribute('data-theme') as Theme | null) ?? 'light',
  );

  const [index, setIndex] = useState<IndexFile | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [month, setMonth] = useState<string>(() => params.get('m') ?? currentMonth());
  const [providers, setProviders] = useState<Provider[]>(() => parseProviders(params.get('p')));
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() => {
    const value = params.get('t');
    return value === 'movie' || value === 'series' ? value : 'all';
  });
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const value = params.get('s');
    return value === 'title' || value === 'rating' ? value : 'date';
  });

  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const monthCache = useRef(new Map<string, Entry[]>()).current;

  const labels = TEXT[language];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}data/index.json`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<IndexFile>;
      })
      .then((data) => {
        if (cancelled) return;
        setIndex(data);
        if (params.get('m')) return;
        // Ohne Monat in der URL den laufenden Monat zeigen – der neueste Monat
        // im Archiv wäre sonst oft der kommende mit reinen Ankündigungen.
        const now = currentMonth();
        const hasCurrent = data.months.some((entry) => entry.month === now);
        const fallback = data.months.find((entry) => entry.month < now)?.month;
        setMonth(hasCurrent ? now : (fallback ?? data.months[0]?.month ?? now));
      })
      .catch(() => !cancelled && setIndexError(true));
    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    const cached = monthCache.get(month);
    if (cached) {
      setEntries(cached);
      setLoadingMonth(false);
      return;
    }

    setLoadingMonth(true);
    fetch(`${BASE}data/months/${month}.json`)
      .then((response) => (response.ok ? (response.json() as Promise<MonthFile>) : null))
      .then((file) => {
        if (cancelled) return;
        // Eine fehlende Datei ist kein Fehler: der Monat liegt außerhalb des Archivs.
        const list = file?.entries ?? [];
        monthCache.set(month, list);
        setEntries(list);
      })
      .catch(() => {
        if (cancelled) return;
        setEntries([]);
      })
      .finally(() => !cancelled && setLoadingMonth(false));

    return () => {
      cancelled = true;
    };
  }, [month, monthCache]);

  // Filterzustand in der URL spiegeln, damit Ansichten teilbar und
  // per Zurück-Button erreichbar bleiben.
  useEffect(() => {
    const next = new URLSearchParams();
    next.set('m', month);
    if (providers.length !== PROVIDERS.length) next.set('p', providers.join(','));
    if (typeFilter !== 'all') next.set('t', typeFilter);
    if (sortKey !== 'date') next.set('s', sortKey);
    next.set('lang', language);
    window.history.replaceState(null, '', `${window.location.pathname}?${next}`);
  }, [month, providers, typeFilter, sortKey, language]);

  const availableMonths = useMemo(() => {
    const latestSelectable = shiftMonth(currentMonth(), 1);
    const archived = index?.months.map((entry) => entry.month) ?? [];
    const start = archived.at(-1) ?? index?.archiveStart ?? currentMonth();
    const end = [archived[0] ?? '', latestSelectable, month].sort().at(-1)!;
    return monthRange([start, month].sort()[0]!, end);
  }, [index, month]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(PROVIDERS.map((provider) => [provider, 0])) as Record<
      Provider,
      number
    >;
    for (const entry of entries ?? []) result[entry.provider] += 1;
    return result;
  }, [entries]);

  const visible = useMemo(() => {
    const filtered = (entries ?? []).filter(
      (entry) =>
        providers.includes(entry.provider) &&
        (typeFilter === 'all' || entry.showType === typeFilter),
    );

    const collator = new Intl.Collator(language);
    return filtered.sort((a, b) => {
      if (sortKey === 'title') return collator.compare(a.title[language], b.title[language]);
      if (sortKey === 'rating') return (b.rating ?? -1) - (a.rating ?? -1);
      return b.addedAt.localeCompare(a.addedAt) || collator.compare(a.title[language], b.title[language]);
    });
  }, [entries, providers, typeFilter, sortKey, language]);

  const toggleProvider = useCallback((provider: Provider) => {
    setProviders((current) => {
      const next = current.includes(provider)
        ? current.filter((item) => item !== provider)
        : [...current, provider];
      // Kein Anbieter aktiv wäre eine leere Seite ohne erkennbaren Grund.
      return next.length ? next : current;
    });
  }, []);

  const beforeArchive = Boolean(index && month < index.archiveStart);

  return (
    <>
      <SiteHeader
        theme={theme}
        language={language}
        onSelectTheme={setTheme}
        onSelectLanguage={setLanguage}
        labels={labels}
      />

      <main>
        <section className="hero">
          <h1>{labels.heroTitle}</h1>
          <p>{labels.heroCopy}</p>
        </section>

        <section className="controls" aria-label={labels.selectMonth}>
          <MonthPicker
            months={availableMonths}
            selected={month}
            language={language}
            labels={labels}
            onSelect={setMonth}
          />

          <div className="filters">
            <ProviderFilter
              active={providers}
              counts={counts}
              legend={labels.providers}
              onToggle={toggleProvider}
            />

            <fieldset className="filter-group">
              <legend>{labels.type}</legend>
              <div className="chip-row">
                {(
                  [
                    ['all', labels.all],
                    ['movie', labels.movies],
                    ['series', labels.series],
                  ] as [TypeFilter, string][]
                ).map(([value, text]) => (
                  <button
                    key={value}
                    type="button"
                    className={`chip${typeFilter === value ? ' is-active' : ''}`}
                    aria-pressed={typeFilter === value}
                    onClick={() => setTypeFilter(value)}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="filter-group">
              <legend>{labels.sortBy}</legend>
              <select
                className="sort-select"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
              >
                <option value="date">{labels.sortDate}</option>
                <option value="title">{labels.sortTitle}</option>
                <option value="rating">{labels.sortRating}</option>
              </select>
            </fieldset>
          </div>
        </section>

        <section className="results">
          <h2 className="results-heading">
            {formatMonth(month, language)}
            <span className="results-count">{labels.titleCount(visible.length)}</span>
          </h2>

          {indexError ? (
            <p className="notice">{labels.loadError}</p>
          ) : loadingMonth ? (
            <p className="notice">{labels.loading}</p>
          ) : beforeArchive ? (
            <p className="notice">{labels.beforeArchive}</p>
          ) : visible.length === 0 ? (
            <p className="notice">{entries?.length ? labels.emptyFiltered : labels.emptyMonth}</p>
          ) : (
            <div className="card-grid">
              {visible.map((entry) => (
                <TitleCard
                  key={`${entry.showId}-${entry.provider}`}
                  entry={entry}
                  language={language}
                  labels={labels}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        {index && <p>{labels.updatedAt(formatTimestamp(index.generatedAt, language))}</p>}
        <p>{labels.dataCredit}</p>
        <p className="footer-fineprint">{labels.disclaimer}</p>
        <p className="footer-links">
          <a href={`${BASE}${language === 'de' ? 'impressum/' : 'en/legal-notice/'}`}>
            {labels.imprint}
          </a>
          <a href={`${BASE}${language === 'de' ? 'datenschutz/' : 'en/privacy/'}`}>{labels.privacy}</a>
        </p>
      </footer>
    </>
  );
}

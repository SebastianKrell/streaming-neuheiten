import { GenreIcon } from './GenreIcon';
import { formatDay, type Labels } from '../i18n';
import { PROVIDER_LABELS, type Entry, type Language } from '../types';

export function TitleCard({
  entry,
  language,
  labels,
  showOverview,
}: {
  entry: Entry;
  language: Language;
  labels: Labels;
  showOverview: boolean;
}) {
  const title = entry.title[language] || entry.title.de || entry.title.en;
  const overview = entry.overview[language] || entry.overview.de || entry.overview.en;
  const provider = PROVIDER_LABELS[entry.provider];
  const day = formatDay(entry.addedAt, language);
  const genres = entry.genres
    .filter((genre) => genre.en)
    .slice(0, 2)
    .map((genre) => ({ key: genre.en, label: genre[language] || genre.de || genre.en }));

  const body = (
    <>
      <div className="card-head">
        <span className={`card-provider chip-${entry.provider}`}>{provider}</span>
        <span className="card-date">
          {entry.upcoming ? labels.comingOn(day) : labels.addedOn(day)}
        </span>
        {entry.rating !== null && entry.rating > 0 && (
          <span className="card-rating" title={labels.sortRating}>
            {(entry.rating / 10).toFixed(1)}
          </span>
        )}
      </div>

      <h3 className="card-title">{title}</h3>

      <p className="card-meta">
        <span>{entry.showType === 'series' ? labels.seriesSingular : labels.movie}</span>
        {entry.releaseYear && <span>{entry.releaseYear}</span>}
        {genres.map((genre) => (
          <span key={genre.key} className="card-genre">
            <GenreIcon name={genre.key} />
            {genre.label}
          </span>
        ))}
        {entry.upcoming && <span className="card-flag">{labels.announced}</span>}
      </p>

      {showOverview && overview && <p className="card-overview">{overview}</p>}
    </>
  );

  const className = `card card-${entry.provider}`;
  if (!entry.link) return <article className={className}>{body}</article>;

  return (
    <a
      className={`${className} card-link`}
      href={entry.link}
      target="_blank"
      rel="noreferrer noopener"
      title={labels.watchOn(provider)}
    >
      {body}
    </a>
  );
}

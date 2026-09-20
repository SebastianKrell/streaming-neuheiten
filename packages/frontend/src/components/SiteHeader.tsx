import type { Language } from '../types';

type Theme = 'light' | 'dark';

/** Eine Kachel je Anbieter, als Anspielung auf ein Poster-Raster. */
function PosterMark() {
  return (
    <svg viewBox="0 0 40 24" width="40" height="24" aria-hidden="true">
      <rect x="0" y="4" width="9" height="18" rx="2" fill="var(--netflix)" />
      <rect x="10" y="2" width="9" height="20" rx="2" fill="var(--disney)" />
      <rect x="20" y="2" width="9" height="20" rx="2" fill="var(--prime)" />
      <rect x="30" y="4" width="9" height="18" rx="2" fill="var(--rtl)" />
    </svg>
  );
}

function GermanFlag() {
  return (
    <svg className="language-flag" viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="16" fill="#ffce00" />
      <rect width="24" height="10.67" fill="#d00" />
      <rect width="24" height="5.33" fill="#000" />
    </svg>
  );
}

function BritishFlag() {
  return (
    <svg className="language-flag" viewBox="0 0 60 36" aria-hidden="true">
      <rect width="60" height="36" fill="#012169" />
      <path d="M0 0 60 36M60 0 0 36" stroke="#fff" strokeWidth="7.2" />
      <path d="M0 0 60 36M60 0 0 36" stroke="#c8102e" strokeWidth="2.4" />
      <path d="M30 0v36M0 18h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v36M0 18h60" stroke="#c8102e" strokeWidth="7.2" />
    </svg>
  );
}

export function SiteHeader({
  theme,
  language,
  onSelectTheme,
  onSelectLanguage,
  labels,
}: {
  theme: Theme;
  language: Language;
  onSelectTheme: (theme: Theme) => void;
  onSelectLanguage: (language: Language) => void;
  labels: {
    light: string;
    dark: string;
    colorScheme: string;
    language: string;
    siteTitle: string;
  };
}) {
  return (
    <header className="site-header-outer">
      <div className="site-header-inner">
        <a className="site-header-logo" href={import.meta.env.BASE_URL}>
          <PosterMark />
          <span className="site-header-title">{labels.siteTitle}</span>
        </a>
        <div className="site-header-controls">
          <div className="language-toggle" aria-label={labels.language}>
            <button
              type="button"
              className={language === 'de' ? 'is-active' : ''}
              onClick={() => onSelectLanguage('de')}
              aria-pressed={language === 'de'}
              title="Deutsch"
            >
              <GermanFlag />
              <span className="visually-hidden">Deutsch</span>
            </button>
            <button
              type="button"
              className={language === 'en' ? 'is-active' : ''}
              onClick={() => onSelectLanguage('en')}
              aria-pressed={language === 'en'}
              title="English"
            >
              <BritishFlag />
              <span className="visually-hidden">English</span>
            </button>
          </div>
          <div className="theme-toggle" aria-label={labels.colorScheme}>
            <button
              type="button"
              className={theme === 'light' ? 'is-active' : ''}
              onClick={() => onSelectTheme('light')}
              aria-pressed={theme === 'light'}
            >
              {labels.light}
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'is-active' : ''}
              onClick={() => onSelectTheme('dark')}
              aria-pressed={theme === 'dark'}
            >
              {labels.dark}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

import type { ReactNode } from 'react';

/**
 * Ein Strichsymbol je Genre. Schlüssel ist der englische Genrename, so wie
 * ihn die Streaming Availability API liefert – derselbe Schlüssel, über den
 * auch der Filter läuft. Alles inline, damit die Seite keine fremden Server
 * kontaktiert (s. Datenschutzerklärung).
 */
const PATHS: Record<string, ReactNode> = {
  Action: <path d="M13 2 5 13h6l-1 9 8-11h-6z" />,
  Adventure: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  Animation: (
    <>
      <path d="M11 3.5 12.9 9l5.1 1.9-5.1 1.9L11 18.3 9.1 12.8 4 10.9 9.1 9z" />
      <path d="M18.5 15.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" />
    </>
  ),
  Comedy: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 14a4.6 4.6 0 0 0 7.6 0" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  Crime: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.4 15.4 5.1 5.1" />
    </>
  ),
  Documentary: (
    <>
      <rect x="3" y="7" width="12.5" height="10" rx="2" />
      <path d="m15.5 11 5.5-3v8l-5.5-3z" />
    </>
  ),
  // Theatervorhang statt Maske: eine Maske sähe der Komödie zu ähnlich.
  Drama: (
    <>
      <path d="M2.5 4.5h19" />
      <path d="M6 4.5v15.5c3 0 4.8-2.4 4.8-6V4.5" />
      <path d="M18 4.5v15.5c-3 0-4.8-2.4-4.8-6V4.5" />
    </>
  ),
  Family: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9.5" r="2.2" />
      <path d="M2.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 19.5a4 4 0 0 1 6-3.4" />
    </>
  ),
  Fantasy: (
    <>
      <path d="m3.5 20.5 10-10" />
      <path d="m16 3 1.2 2.8L20 7l-2.8 1.2L16 11l-1.2-2.8L12 7l2.8-1.2z" />
    </>
  ),
  History: (
    <>
      <path d="M7 3.5h10M7 20.5h10" />
      <path d="M8 3.5v3.3L12 11l4-4.2V3.5" />
      <path d="M8 20.5v-3.3L12 13l4 4.2v3.3" />
    </>
  ),
  Horror: (
    <>
      <path d="M5 20.5V10a7 7 0 0 1 14 0v10.5l-2.3-1.8-2.4 1.8-2.3-1.8-2.3 1.8z" />
      <path d="M9.5 10.5h.01M14.5 10.5h.01" />
    </>
  ),
  Music: (
    <>
      <circle cx="6.5" cy="17.5" r="2.8" />
      <circle cx="17.5" cy="15.5" r="2.8" />
      <path d="M9.3 17.5V6.8l11-2v10.7" />
    </>
  ),
  Mystery: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.1-2.5 3.8" />
      <path d="M12 17h.01" />
    </>
  ),
  News: (
    <>
      <path d="M4 4.5h12.5v15H5.5a1.5 1.5 0 0 1-1.5-1.5z" />
      <path d="M16.5 9h3.5v8.5a2 2 0 0 1-3.5 1.3" />
      <path d="M7 8h6.5M7 11.5h6.5M7 15h4" />
    </>
  ),
  Reality: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="m8 4 4 4 4-4" />
    </>
  ),
  Romance: <path d="M12 20.3 4.7 13a4.6 4.6 0 0 1 6.4-6.6l.9.8.9-.8A4.6 4.6 0 0 1 19.3 13z" />,
  'Science Fiction': (
    <>
      <circle cx="12" cy="12" r="6" />
      <ellipse cx="12" cy="12" rx="10.5" ry="3.8" transform="rotate(-25 12 12)" />
    </>
  ),
  'Talk Show': (
    <>
      <path d="M13 4H5a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2v3l3.6-3H13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <path d="M18.5 9.5H19a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2v3l-3.6-3" />
    </>
  ),
  Thriller: <path d="M2.5 12H7l2.6-6.8L14.2 19l2.3-7h5" />,
  War: <path d="M12 3.2 20 6v5.6c0 4.7-3.3 7.8-8 9.3-4.7-1.5-8-4.6-8-9.3V6z" />,
  Western: (
    <>
      <path d="M7.5 13.8V9.2a4.5 4.5 0 0 1 9 0v4.6" />
      <path d="M3 14.4c1.3 1.6 4.9 2.6 9 2.6s7.7-1 9-2.6" />
      <path d="M3 14.4c0-.9 1-1.6 2.6-2.1M21 14.4c0-.9-1-1.6-2.6-2.1" />
    </>
  ),
};

/** Für Genres, die die API künftig liefert und die hier noch fehlen. */
const FALLBACK = (
  <>
    <path d="M20.6 12.4 12.4 20.6a1.5 1.5 0 0 1-2.1 0L3.4 13.7a1.5 1.5 0 0 1-.4-1V4.5a1.5 1.5 0 0 1 1.5-1.5h8.2c.4 0 .8.1 1 .4l6.9 6.9a1.5 1.5 0 0 1 0 2.1z" />
    <path d="M7.5 7.5h.01" />
  </>
);

export function GenreIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      className={className ? `genre-icon ${className}` : 'genre-icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] ?? FALLBACK}
    </svg>
  );
}

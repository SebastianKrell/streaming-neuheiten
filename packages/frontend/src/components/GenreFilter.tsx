import { useEffect, useRef, useState } from 'react';

export interface GenreOption {
  /** Sprachunabhängiger Schlüssel (englischer Genrename), steht so in der URL. */
  key: string;
  label: string;
  count: number;
}

export function GenreFilter({
  options,
  selected,
  labels,
  onToggle,
  onReset,
}: {
  options: GenreOption[];
  /** Leer bedeutet "kein Filter", nicht "nichts anzeigen". */
  selected: string[];
  labels: { genres: string; allGenres: string; reset: string };
  onToggle: (key: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const summary = selected.length === 0 ? labels.allGenres : `${selected.length}/${options.length}`;

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className={`dropdown-toggle${open ? ' is-open' : ''}${selected.length ? ' is-filtered' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        disabled={options.length === 0}
      >
        <span>{summary}</span>
        <span className="dropdown-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="dropdown-panel" role="group" aria-label={labels.genres}>
          <button
            type="button"
            className="dropdown-action"
            onClick={onReset}
            disabled={selected.length === 0}
          >
            {labels.reset}
          </button>
          {options.map((option) => (
            <label className="dropdown-option" key={option.key}>
              <input
                type="checkbox"
                checked={selected.includes(option.key)}
                onChange={() => onToggle(option.key)}
              />
              <span className="dropdown-option-label">{option.label}</span>
              <span className="dropdown-option-count">{option.count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

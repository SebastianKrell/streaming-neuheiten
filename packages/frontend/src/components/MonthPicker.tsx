import { formatMonth } from '../i18n';
import type { Language } from '../types';

export function MonthPicker({
  months,
  selected,
  language,
  labels,
  onSelect,
}: {
  /** Aufsteigend sortierte Liste wählbarer Monate im Format `YYYY-MM`. */
  months: string[];
  selected: string;
  language: Language;
  labels: { previousMonth: string; nextMonth: string; selectMonth: string };
  onSelect: (month: string) => void;
}) {
  const index = months.indexOf(selected);
  const previous = index > 0 ? months[index - 1] : undefined;
  const next = index >= 0 && index < months.length - 1 ? months[index + 1] : undefined;

  return (
    <div className="month-picker">
      <button
        type="button"
        className="month-step"
        onClick={() => previous && onSelect(previous)}
        disabled={!previous}
        aria-label={labels.previousMonth}
      >
        ‹
      </button>
      <div className="month-current">
        <select
          value={selected}
          onChange={(event) => onSelect(event.target.value)}
          aria-label={labels.selectMonth}
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month, language)}
            </option>
          ))}
        </select>
        <span aria-hidden="true">{formatMonth(selected, language)}</span>
      </div>
      <button
        type="button"
        className="month-step"
        onClick={() => next && onSelect(next)}
        disabled={!next}
        aria-label={labels.nextMonth}
      >
        ›
      </button>
    </div>
  );
}

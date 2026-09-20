import { PROVIDER_LABELS, PROVIDERS, type Provider } from '../types';

export function ProviderFilter({
  active,
  counts,
  legend,
  onToggle,
}: {
  active: Provider[];
  counts: Record<Provider, number>;
  legend: string;
  onToggle: (provider: Provider) => void;
}) {
  return (
    <fieldset className="filter-group">
      <legend>{legend}</legend>
      <div className="chip-row">
        {PROVIDERS.map((provider) => {
          const isActive = active.includes(provider);
          return (
            <button
              key={provider}
              type="button"
              className={`chip chip-${provider}${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onToggle(provider)}
            >
              <span className="chip-dot" aria-hidden="true" />
              {PROVIDER_LABELS[provider]}
              <span className="chip-count">{counts[provider]}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

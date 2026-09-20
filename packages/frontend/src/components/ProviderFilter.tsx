import { ProviderMark } from './ProviderMark';
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
              className={`chip chip-provider provider-${provider}${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              // Name nur als Tooltip und für Screenreader – auf Touchgeräten
              // gibt es kein Hover, dort tragen Farbe und Kürzel allein.
              title={PROVIDER_LABELS[provider]}
              onClick={() => onToggle(provider)}
            >
              <ProviderMark provider={provider} />
              <span className="chip-count">{counts[provider]}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

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
              onClick={() => onToggle(provider)}
            >
              {/* Die Kachel steht auch auf den Titelkacheln – hier neben dem
                  Namen dient sie zugleich als Legende dafür. */}
              <ProviderMark provider={provider} withLabel={false} />
              {PROVIDER_LABELS[provider]}
              <span className="chip-count">{counts[provider]}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

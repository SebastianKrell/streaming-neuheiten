import { PROVIDER_LABELS, type Provider } from '../types';

/**
 * Kompaktes Anbieterzeichen: farbige Kachel mit Monogramm.
 *
 * Bewusst kein Nachbau der echten Firmenlogos – das sind geschützte
 * Markenzeichen, und dieses Projekt ist ein inoffizielles Fanprojekt.
 * Farbe plus Kürzel sind eindeutig genug, den vollen Namen liefern
 * Tooltip und Screenreader-Text.
 */
const MARKS: Record<Provider, string> = {
  netflix: 'N',
  disney: 'D+',
  prime: 'PV',
  apple: 'tv',
  rtl: 'R+',
};

export function ProviderMark({
  provider,
  /** Aus, wo der Name ohnehin sichtbar danebensteht – sonst doppelt vorgelesen. */
  withLabel = true,
}: {
  provider: Provider;
  withLabel?: boolean;
}) {
  return (
    <>
      <span className="provider-mark" aria-hidden="true">
        {MARKS[provider]}
      </span>
      {withLabel && <span className="visually-hidden">{PROVIDER_LABELS[provider]}</span>}
    </>
  );
}

import { loadDotEnv, requireEnv } from './env.js';

/**
 * Gibt alle Streamingdienste aus, die die API für Deutschland kennt – samt
 * Katalog-IDs, wie sie der `catalogs`-Parameter erwartet. Damit lässt sich
 * prüfen, ob ein Anbieter (z. B. RTL+) überhaupt abgedeckt ist, bevor man
 * ihn in PROVIDERS aufnimmt. Kostet einen einzigen Request.
 *
 *   npm run services -w data-collector
 */
interface Service {
  id?: string;
  name?: string;
  streamingOptionTypes?: Record<string, boolean> | string[];
  addons?: { id?: string; name?: string }[];
}

interface CountryResponse {
  countryCode?: string;
  name?: string;
  services?: Record<string, Service> | Service[];
}

function optionTypes(service: Service): string[] {
  const types = service.streamingOptionTypes;
  if (!types) return [];
  if (Array.isArray(types)) return types;
  return Object.entries(types)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type);
}

async function main(): Promise<void> {
  loadDotEnv();
  const apiKey = requireEnv('STREAMING_API_KEY');

  const response = await fetch('https://api.movieofthenight.com/v4/countries/de', {
    headers: { 'X-API-Key': apiKey },
  });
  if (!response.ok) {
    throw new Error(`API antwortete mit ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as CountryResponse;
  const services = Array.isArray(payload.services)
    ? payload.services
    : Object.values(payload.services ?? {});

  console.log(`Deutschland: ${services.length} Dienste\n`);
  for (const service of [...services].sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''))) {
    const types = optionTypes(service);
    console.log(
      `  ${(service.id ?? '?').padEnd(16)} ${(service.name ?? '?').padEnd(24)} ${types.join(', ') || '–'}`,
    );
    for (const addon of service.addons ?? []) {
      console.log(`      ↳ ${service.id}.addon.${addon.id}  ${addon.name ?? ''}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

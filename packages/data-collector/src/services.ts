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

  // Optional: zählen, wie viele Neuzugänge einzelne Kataloge im Fenster hatten.
  // Beantwortet die Frage, warum ein Anbieter so wenige Einträge beisteuert –
  // z. B. weil sein Angebot als `free` statt `subscription` geführt wird.
  //   npm run services -- rtl rtl.free rtl.subscription
  const probes = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  if (probes.length === 0) return;

  const to = Math.floor(Date.now() / 1000);
  const from = to - 31 * 24 * 60 * 60 + 10 * 60;
  console.log('\nNeuzugänge der letzten 31 Tage je Katalog:');
  for (const catalog of probes) {
    console.log(`  ${catalog.padEnd(22)} ${await countChanges(apiKey, catalog, from, to)}`);
  }
}

/** Zählt Änderungen bis maximal 10 Seiten – genug, um Größenordnungen zu trennen. */
async function countChanges(
  apiKey: string,
  catalog: string,
  from: number,
  to: number,
): Promise<string> {
  let cursor: string | null = null;
  let total = 0;

  for (let page = 0; page < 10; page += 1) {
    const url = new URL('https://api.movieofthenight.com/v4/changes');
    url.searchParams.set('country', 'de');
    url.searchParams.set('change_type', 'new');
    url.searchParams.set('item_type', 'show');
    url.searchParams.set('catalogs', catalog);
    url.searchParams.set('from', String(from));
    url.searchParams.set('to', String(to));
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url, { headers: { 'X-API-Key': apiKey } });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return `Fehler ${response.status} ${body.slice(0, 120)}`;
    }

    const payload = (await response.json()) as {
      changes?: unknown[];
      hasMore?: boolean;
      nextCursor?: string | null;
    };
    total += payload.changes?.length ?? 0;
    if (!payload.hasMore) return String(total);
    cursor = payload.nextCursor ?? null;
    if (!cursor) return String(total);
  }

  return `${total}+ (abgebrochen)`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

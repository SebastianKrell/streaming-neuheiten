import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(here, '../../../.env');

/**
 * Lädt die `.env` im Repo-Wurzelverzeichnis, falls vorhanden. Bewusst kein
 * `--env-file`-Flag: das gibt es erst in neueren Node-Versionen und der
 * Collector soll auch lokal mit älteren Runtimes laufen. In CI kommen die
 * Werte ohnehin aus GitHub-Secrets, dann existiert die Datei gar nicht.
 */
export function loadDotEnv(): void {
  let raw: string;
  try {
    raw = readFileSync(ENV_PATH, 'utf-8');
  } catch {
    return;
  }

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Umgebungsvariable ${name} fehlt. Lokal in .env im Repo-Wurzelverzeichnis setzen, ` +
        'in GitHub Actions als Repository-Secret hinterlegen.',
    );
  }
  return value;
}

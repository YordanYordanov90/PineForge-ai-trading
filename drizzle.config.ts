import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Config } from 'drizzle-kit';

function loadEnvFile(filename: string): void {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    const value = raw.replace(/^(['"])(.*)\1$/, '$2');
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
} satisfies Config;

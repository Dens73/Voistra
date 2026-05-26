import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
const envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith('#')) {
    continue;
  }

  const separatorIndex = trimmed.indexOf('=');

  if (separatorIndex === -1) {
    continue;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const value = trimmed.slice(separatorIndex + 1).trim();

  if (!(key in process.env)) {
    process.env[key] = value;
  }
}

const host = process.env.DB_HOST ?? 'localhost';
const port = Number(process.env.DB_PORT ?? '5432');
const user = process.env.DB_USER ?? 'postgres';
const password = process.env.DB_PASSWORD ?? 'postgres';
const database = process.env.DB_NAME ?? 'diploma_voip';

const adminClient = new Client({
  host,
  port,
  user,
  password,
  database: 'postgres',
});

try {
  await adminClient.connect();
  const existing = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);

  if (existing.rowCount && existing.rowCount > 0) {
    console.log(`Database ${database} already exists.`);
  } else {
    await adminClient.query(`CREATE DATABASE \"${database.replace(/\"/g, '""')}\"`);
    console.log(`Database ${database} created.`);
  }
} finally {
  await adminClient.end().catch(() => undefined);
}

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { saveSnapshot } from './snapshot';

export interface ImportResult {
  name: string;
  count: number;
  skipped: string[];
}

export function parseDotenv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split('\n');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      env[key] = value;
    }
  }

  return env;
}

export function parseShellExport(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const exportRegex = /^export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    const match = line.match(exportRegex);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

export type ImportFormat = 'dotenv' | 'shell';

export function importSnapshot(
  filePath: string,
  snapshotName: string,
  format: ImportFormat = 'dotenv'
): ImportResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed =
    format === 'shell' ? parseShellExport(content) : parseDotenv(content);

  const skipped: string[] = [];
  const clean: Record<string, string> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      clean[key] = value;
    } else {
      skipped.push(key);
    }
  }

  saveSnapshot(snapshotName, clean);

  return { name: snapshotName, count: Object.keys(clean).length, skipped };
}

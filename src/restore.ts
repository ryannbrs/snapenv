import * as fs from 'fs';
import * as path from 'path';
import { loadSnapshot } from './snapshot';

export interface RestoreOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  outputFile?: string;
}

export interface RestoreResult {
  applied: Record<string, string>;
  skipped: Record<string, string>;
  outputPath?: string;
}

/**
 * Restores environment variables from a named snapshot.
 * By default writes to a .env file in the current working directory.
 */
export function restoreSnapshot(
  snapshotName: string,
  options: RestoreOptions = {}
): RestoreResult {
  const { dryRun = false, overwrite = true, outputFile = '.env' } = options;

  const snapshot = loadSnapshot(snapshotName);
  const outputPath = path.resolve(process.cwd(), outputFile);

  const existing: Record<string, string> = {};
  if (fs.existsSync(outputPath)) {
    const content = fs.readFileSync(outputPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      existing[key] = value;
    }
  }

  const applied: Record<string, string> = {};
  const skipped: Record<string, string> = {};

  for (const [key, value] of Object.entries(snapshot.env)) {
    if (!overwrite && key in existing) {
      skipped[key] = value;
    } else {
      applied[key] = value;
    }
  }

  if (!dryRun) {
    const merged = { ...existing, ...applied };
    const lines = Object.entries(merged).map(
      ([k, v]) => `${k}=${v}`
    );
    fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf-8');
  }

  return { applied, skipped, outputPath: dryRun ? undefined : outputPath };
}

/**
 * Formats the restore result into a human-readable summary string.
 */
export function formatRestoreResult(result: RestoreResult): string {
  const lines: string[] = [];

  const appliedKeys = Object.keys(result.applied);
  const skippedKeys = Object.keys(result.skipped);

  if (appliedKeys.length === 0 && skippedKeys.length === 0) {
    lines.push('No environment variables to restore.');
    return lines.join('\n');
  }

  if (appliedKeys.length > 0) {
    lines.push(`Applied (${appliedKeys.length}):`);
    for (const key of appliedKeys) {
      lines.push(`  + ${key}=${result.applied[key]}`);
    }
  }

  if (skippedKeys.length > 0) {
    lines.push(`Skipped (${skippedKeys.length}):`);
    for (const key of skippedKeys) {
      lines.push(`  ~ ${key} (already set)`);
    }
  }

  if (result.outputPath) {
    lines.push(`\nWritten to: ${result.outputPath}`);
  }

  return lines.join('\n');
}

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { matchesPattern, searchSnapshots, formatSearchResults } from './search';
import { saveSnapshot, ensureSnapshotsDir } from './snapshot';
import fs from 'fs/promises';
import path from 'path';

const SNAPSHOTS_DIR = path.join(process.cwd(), '.snapenv');

async function cleanup() {
  await fs.rm(SNAPSHOTS_DIR, { recursive: true, force: true });
}

beforeEach(async () => {
  await cleanup();
  await ensureSnapshotsDir();
});

afterEach(cleanup);

describe('matchesPattern', () => {
  it('matches regex patterns', () => {
    expect(matchesPattern('DATABASE_URL', 'DATABASE.*', false)).toBe(true);
    expect(matchesPattern('API_KEY', 'DATABASE.*', false)).toBe(false);
  });

  it('is case-insensitive by default', () => {
    expect(matchesPattern('database_url', 'DATABASE', false)).toBe(true);
  });

  it('respects case-sensitive flag', () => {
    expect(matchesPattern('database_url', 'DATABASE', true)).toBe(false);
  });

  it('falls back to substring match on invalid regex', () => {
    expect(matchesPattern('VALUE[0]', 'VALUE[', false)).toBe(true);
  });
});

describe('searchSnapshots', () => {
  it('finds entries by key pattern', async () => {
    await saveSnapshot('dev', { DATABASE_URL: 'postgres://localhost', PORT: '3000' });
    const results = await searchSnapshots({ keyPattern: 'DATABASE' });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ snapshotName: 'dev', key: 'DATABASE_URL' });
  });

  it('finds entries by value pattern', async () => {
    await saveSnapshot('prod', { DATABASE_URL: 'postgres://prod', PORT: '443' });
    const results = await searchSnapshots({ valuePattern: 'postgres' });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DATABASE_URL');
  });

  it('combines key and value patterns', async () => {
    await saveSnapshot('staging', { API_KEY: 'secret', API_URL: 'https://api.example.com' });
    const results = await searchSnapshots({ keyPattern: 'API', valuePattern: 'https' });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('API_URL');
  });

  it('searches across multiple snapshots', async () => {
    await saveSnapshot('snap1', { FOO: 'bar' });
    await saveSnapshot('snap2', { FOO: 'baz' });
    const results = await searchSnapshots({ keyPattern: 'FOO' });
    expect(results).toHaveLength(2);
  });
});

describe('formatSearchResults', () => {
  it('returns message when no results', () => {
    expect(formatSearchResults([])).toBe('No matches found.');
  });

  it('groups results by snapshot', () => {
    const results = [
      { snapshotName: 'dev', key: 'PORT', value: '3000' },
      { snapshotName: 'prod', key: 'PORT', value: '443' },
    ];
    const output = formatSearchResults(results);
    expect(output).toContain('[dev]');
    expect(output).toContain('[prod]');
    expect(output).toContain('PORT=3000');
    expect(output).toContain('PORT=443');
  });
});

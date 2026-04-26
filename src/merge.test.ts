import * as fs from 'fs';
import * as path from 'path';
import { mergeEnvs, mergeSnapshots, formatMergeResult } from './merge';
import { saveSnapshot, ensureSnapshotsDir } from './snapshot';

const TEST_DIR = path.join(__dirname, '../.snapshots-test-merge');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

beforeEach(() => {
  cleanup();
  process.env.SNAPENV_DIR = TEST_DIR;
  ensureSnapshotsDir();
});

afterEach(() => {
  cleanup();
  delete process.env.SNAPENV_DIR;
});

describe('mergeEnvs', () => {
  test('merges non-overlapping keys', () => {
    const base = { A: '1', B: '2' };
    const incoming = { C: '3', D: '4' };
    const result = mergeEnvs(base, incoming);
    expect(result.merged).toEqual({ A: '1', B: '2', C: '3', D: '4' });
    expect(result.added).toEqual(['C', 'D']);
    expect(result.conflicts).toHaveLength(0);
    expect(result.overwritten).toHaveLength(0);
  });

  test('uses incoming strategy on conflict by default', () => {
    const base = { A: '1' };
    const incoming = { A: '2' };
    const result = mergeEnvs(base, incoming);
    expect(result.merged.A).toBe('2');
    expect(result.overwritten).toContain('A');
    expect(result.conflicts).toHaveLength(1);
  });

  test('uses base strategy on conflict', () => {
    const base = { A: '1' };
    const incoming = { A: '2' };
    const result = mergeEnvs(base, incoming, 'base');
    expect(result.merged.A).toBe('1');
    expect(result.overwritten).toHaveLength(0);
    expect(result.conflicts).toHaveLength(1);
  });

  test('throws on conflict with error strategy', () => {
    const base = { A: '1' };
    const incoming = { A: '2' };
    expect(() => mergeEnvs(base, incoming, 'error')).toThrow('Merge conflict on key: A');
  });

  test('returns no changes for identical envs', () => {
    const env = { A: '1', B: '2' };
    const result = mergeEnvs(env, { ...env });
    expect(result.added).toHaveLength(0);
    expect(result.conflicts).toHaveLength(0);
    expect(result.overwritten).toHaveLength(0);
  });
});

describe('mergeSnapshots', () => {
  test('merges two snapshots and saves result', async () => {
    await saveSnapshot('base', { X: 'hello' });
    await saveSnapshot('feature', { Y: 'world' });
    const result = await mergeSnapshots('base', 'feature', 'merged');
    expect(result.merged).toEqual({ X: 'hello', Y: 'world' });
    expect(result.added).toContain('Y');
  });
});

describe('formatMergeResult', () => {
  test('formats a result with all fields', () => {
    const result = {
      merged: {},
      conflicts: [{ key: 'FOO', base: 'a', incoming: 'b' }],
      added: ['BAR'],
      overwritten: ['FOO'],
    };
    const output = formatMergeResult(result);
    expect(output).toContain('Added');
    expect(output).toContain('BAR');
    expect(output).toContain('Overwritten');
    expect(output).toContain('FOO');
    expect(output).toContain('Conflicts');
  });

  test('shows identical message when no changes', () => {
    const result = { merged: {}, conflicts: [], added: [], overwritten: [] };
    expect(formatMergeResult(result)).toContain('identical');
  });
});

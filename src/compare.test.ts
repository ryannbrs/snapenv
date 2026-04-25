import * as fs from 'fs';
import * as path from 'path';
import { compareSnapshots, formatCompareResult } from './compare';
import { saveSnapshot } from './snapshot';

const TEST_DIR = path.join(process.cwd(), '.snapenv');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

beforeEach(cleanup);
afterAll(cleanup);

describe('compareSnapshots', () => {
  it('identifies keys only in snapshot A', () => {
    saveSnapshot('snap-a', { FOO: 'bar', ONLY_A: 'yes' });
    saveSnapshot('snap-b', { FOO: 'bar' });
    const result = compareSnapshots('snap-a', 'snap-b');
    expect(result.onlyInA).toEqual({ ONLY_A: 'yes' });
    expect(result.onlyInB).toEqual({});
  });

  it('identifies keys only in snapshot B', () => {
    saveSnapshot('snap-a', { FOO: 'bar' });
    saveSnapshot('snap-b', { FOO: 'bar', ONLY_B: 'yes' });
    const result = compareSnapshots('snap-a', 'snap-b');
    expect(result.onlyInB).toEqual({ ONLY_B: 'yes' });
    expect(result.onlyInA).toEqual({});
  });

  it('identifies changed values', () => {
    saveSnapshot('snap-a', { KEY: 'old' });
    saveSnapshot('snap-b', { KEY: 'new' });
    const result = compareSnapshots('snap-a', 'snap-b');
    expect(result.changed).toEqual({ KEY: { a: 'old', b: 'new' } });
  });

  it('identifies identical values', () => {
    saveSnapshot('snap-a', { SAME: 'value' });
    saveSnapshot('snap-b', { SAME: 'value' });
    const result = compareSnapshots('snap-a', 'snap-b');
    expect(result.identical).toEqual({ SAME: 'value' });
    expect(Object.keys(result.changed)).toHaveLength(0);
  });

  it('returns correct totals', () => {
    saveSnapshot('snap-a', { A: '1', B: '2' });
    saveSnapshot('snap-b', { A: '1', C: '3', D: '4' });
    const result = compareSnapshots('snap-a', 'snap-b');
    expect(result.totalA).toBe(2);
    expect(result.totalB).toBe(3);
  });
});

describe('formatCompareResult', () => {
  it('includes snapshot names in output', () => {
    saveSnapshot('alpha', { X: '1' });
    saveSnapshot('beta', { X: '2' });
    const result = compareSnapshots('alpha', 'beta');
    const output = formatCompareResult(result);
    expect(output).toContain('alpha');
    expect(output).toContain('beta');
  });

  it('shows changed keys with arrow', () => {
    saveSnapshot('s1', { PORT: '3000' });
    saveSnapshot('s2', { PORT: '4000' });
    const result = compareSnapshots('s1', 's2');
    const output = formatCompareResult(result);
    expect(output).toContain('PORT');
    expect(output).toContain('→');
  });

  it('shows identical count', () => {
    saveSnapshot('s1', { A: '1', B: '2' });
    saveSnapshot('s2', { A: '1', B: '2' });
    const result = compareSnapshots('s1', 's2');
    const output = formatCompareResult(result);
    expect(output).toContain('Identical: 2');
  });
});

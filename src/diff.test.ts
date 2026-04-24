import { diffSnapshots, formatDiff } from './diff';
import { EnvSnapshot } from './snapshot';

const makeSnapshot = (variables: Record<string, string>): EnvSnapshot => ({
  name: 'test',
  createdAt: new Date().toISOString(),
  variables,
});

describe('diffSnapshots', () => {
  it('detects added keys', () => {
    const base = makeSnapshot({ FOO: 'bar' });
    const target = makeSnapshot({ FOO: 'bar', NEW_KEY: 'value' });
    const diff = diffSnapshots(base, target);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]).toMatchObject({ key: 'NEW_KEY', type: 'added', newValue: 'value' });
  });

  it('detects removed keys', () => {
    const base = makeSnapshot({ FOO: 'bar', OLD_KEY: 'gone' });
    const target = makeSnapshot({ FOO: 'bar' });
    const diff = diffSnapshots(base, target);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0]).toMatchObject({ key: 'OLD_KEY', type: 'removed', oldValue: 'gone' });
  });

  it('detects changed values', () => {
    const base = makeSnapshot({ FOO: 'old' });
    const target = makeSnapshot({ FOO: 'new' });
    const diff = diffSnapshots(base, target);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]).toMatchObject({ key: 'FOO', type: 'changed', oldValue: 'old', newValue: 'new' });
  });

  it('tracks unchanged keys', () => {
    const base = makeSnapshot({ FOO: 'same', BAR: 'same' });
    const target = makeSnapshot({ FOO: 'same', BAR: 'same' });
    const diff = diffSnapshots(base, target);
    expect(diff.unchanged).toContain('FOO');
    expect(diff.unchanged).toContain('BAR');
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });
});

describe('formatDiff', () => {
  it('returns no differences message when identical', () => {
    const base = makeSnapshot({ FOO: 'bar' });
    const target = makeSnapshot({ FOO: 'bar' });
    const diff = diffSnapshots(base, target);
    expect(formatDiff(diff)).toBe('No differences found.');
  });

  it('formats added, removed, and changed lines', () => {
    const base = makeSnapshot({ OLD: 'x', SAME: 'y', CHANGE: 'before' });
    const target = makeSnapshot({ NEW: 'z', SAME: 'y', CHANGE: 'after' });
    const diff = diffSnapshots(base, target);
    const output = formatDiff(diff);
    expect(output).toContain('+ NEW=z');
    expect(output).toContain('- OLD=x');
    expect(output).toContain('~ CHANGE: before → after');
  });
});

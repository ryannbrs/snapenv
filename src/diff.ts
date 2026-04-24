import { EnvSnapshot } from './snapshot';

export interface DiffEntry {
  key: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: string;
  newValue?: string;
}

export interface SnapshotDiff {
  added: DiffEntry[];
  removed: DiffEntry[];
  changed: DiffEntry[];
  unchanged: string[];
}

export function diffSnapshots(
  base: EnvSnapshot,
  target: EnvSnapshot
): SnapshotDiff {
  const baseVars = base.variables;
  const targetVars = target.variables;

  const allKeys = new Set([...Object.keys(baseVars), ...Object.keys(targetVars)]);

  const result: SnapshotDiff = {
    added: [],
    removed: [],
    changed: [],
    unchanged: [],
  };

  for (const key of allKeys) {
    const inBase = key in baseVars;
    const inTarget = key in targetVars;

    if (!inBase && inTarget) {
      result.added.push({ key, type: 'added', newValue: targetVars[key] });
    } else if (inBase && !inTarget) {
      result.removed.push({ key, type: 'removed', oldValue: baseVars[key] });
    } else if (baseVars[key] !== targetVars[key]) {
      result.changed.push({
        key,
        type: 'changed',
        oldValue: baseVars[key],
        newValue: targetVars[key],
      });
    } else {
      result.unchanged.push(key);
    }
  }

  return result;
}

export function formatDiff(diff: SnapshotDiff): string {
  const lines: string[] = [];

  for (const entry of diff.added) {
    lines.push(`+ ${entry.key}=${entry.newValue}`);
  }

  for (const entry of diff.removed) {
    lines.push(`- ${entry.key}=${entry.oldValue}`);
  }

  for (const entry of diff.changed) {
    lines.push(`~ ${entry.key}: ${entry.oldValue} → ${entry.newValue}`);
  }

  if (lines.length === 0) {
    return 'No differences found.';
  }

  return lines.join('\n');
}

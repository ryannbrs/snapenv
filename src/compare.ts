import { loadSnapshot } from './snapshot';

export interface CompareResult {
  snapshotA: string;
  snapshotB: string;
  onlyInA: Record<string, string>;
  onlyInB: Record<string, string>;
  changed: Record<string, { a: string; b: string }>;
  identical: Record<string, string>;
  totalA: number;
  totalB: number;
}

export function compareSnapshots(
  nameA: string,
  nameB: string
): CompareResult {
  const envA = loadSnapshot(nameA);
  const envB = loadSnapshot(nameB);

  const keysA = new Set(Object.keys(envA));
  const keysB = new Set(Object.keys(envB));
  const allKeys = new Set([...keysA, ...keysB]);

  const onlyInA: Record<string, string> = {};
  const onlyInB: Record<string, string> = {};
  const changed: Record<string, { a: string; b: string }> = {};
  const identical: Record<string, string> = {};

  for (const key of allKeys) {
    const inA = keysA.has(key);
    const inB = keysB.has(key);
    if (inA && !inB) {
      onlyInA[key] = envA[key];
    } else if (!inA && inB) {
      onlyInB[key] = envB[key];
    } else if (envA[key] !== envB[key]) {
      changed[key] = { a: envA[key], b: envB[key] };
    } else {
      identical[key] = envA[key];
    }
  }

  return {
    snapshotA: nameA,
    snapshotB: nameB,
    onlyInA,
    onlyInB,
    changed,
    identical,
    totalA: keysA.size,
    totalB: keysB.size,
  };
}

export function formatCompareResult(result: CompareResult): string {
  const lines: string[] = [];
  lines.push(`Comparing "${result.snapshotA}" (${result.totalA} vars) vs "${result.snapshotB}" (${result.totalB} vars)\n`);

  const onlyAKeys = Object.keys(result.onlyInA);
  if (onlyAKeys.length > 0) {
    lines.push(`Only in "${result.snapshotA}" (${onlyAKeys.length}):`);
    for (const key of onlyAKeys) {
      lines.push(`  - ${key}=${result.onlyInA[key]}`);
    }
    lines.push('');
  }

  const onlyBKeys = Object.keys(result.onlyInB);
  if (onlyBKeys.length > 0) {
    lines.push(`Only in "${result.snapshotB}" (${onlyBKeys.length}):`);
    for (const key of onlyBKeys) {
      lines.push(`  + ${key}=${result.onlyInB[key]}`);
    }
    lines.push('');
  }

  const changedKeys = Object.keys(result.changed);
  if (changedKeys.length > 0) {
    lines.push(`Changed (${changedKeys.length}):`);
    for (const key of changedKeys) {
      lines.push(`  ~ ${key}: "${result.changed[key].a}" → "${result.changed[key].b}"`);
    }
    lines.push('');
  }

  lines.push(`Identical: ${Object.keys(result.identical).length} var(s)`);
  return lines.join('\n');
}

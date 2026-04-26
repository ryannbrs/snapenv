import { loadSnapshot, saveSnapshot } from './snapshot';

export interface MergeResult {
  merged: Record<string, string>;
  conflicts: Array<{ key: string; base: string; incoming: string }>;
  added: string[];
  overwritten: string[];
}

export type ConflictStrategy = 'base' | 'incoming' | 'error';

export function mergeEnvs(
  base: Record<string, string>,
  incoming: Record<string, string>,
  strategy: ConflictStrategy = 'incoming'
): MergeResult {
  const merged: Record<string, string> = { ...base };
  const conflicts: MergeResult['conflicts'] = [];
  const added: string[] = [];
  const overwritten: string[] = [];

  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in base)) {
      merged[key] = value;
      added.push(key);
    } else if (base[key] !== value) {
      conflicts.push({ key, base: base[key], incoming: value });
      if (strategy === 'error') {
        throw new Error(`Merge conflict on key: ${key}`);
      } else if (strategy === 'incoming') {
        merged[key] = value;
        overwritten.push(key);
      }
      // strategy === 'base': keep existing, do nothing
    }
  }

  return { merged, conflicts, added, overwritten };
}

export async function mergeSnapshots(
  baseName: string,
  incomingName: string,
  outputName: string,
  strategy: ConflictStrategy = 'incoming'
): Promise<MergeResult> {
  const base = await loadSnapshot(baseName);
  const incoming = await loadSnapshot(incomingName);
  const result = mergeEnvs(base, incoming, strategy);
  await saveSnapshot(outputName, result.merged);
  return result;
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [];
  if (result.added.length > 0) {
    lines.push(`Added (${result.added.length}): ${result.added.join(', ')}`);
  }
  if (result.overwritten.length > 0) {
    lines.push(`Overwritten (${result.overwritten.length}): ${result.overwritten.join(', ')}`);
  }
  if (result.conflicts.length > 0) {
    lines.push(`Conflicts (${result.conflicts.length}):`);
    for (const c of result.conflicts) {
      lines.push(`  ${c.key}: "${c.base}" -> "${c.incoming}"`);
    }
  }
  if (lines.length === 0) {
    lines.push('No changes — snapshots are identical.');
  }
  return lines.join('\n');
}

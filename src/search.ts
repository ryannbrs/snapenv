import { loadSnapshot, listSnapshots } from './snapshot';

export interface SearchResult {
  snapshotName: string;
  key: string;
  value: string;
}

export interface SearchOptions {
  keyPattern?: string;
  valuePattern?: string;
  caseSensitive?: boolean;
}

export function matchesPattern(input: string, pattern: string, caseSensitive: boolean): boolean {
  const flags = caseSensitive ? '' : 'i';
  try {
    const regex = new RegExp(pattern, flags);
    return regex.test(input);
  } catch {
    // Fallback to plain string match if invalid regex
    const a = caseSensitive ? input : input.toLowerCase();
    const b = caseSensitive ? pattern : pattern.toLowerCase();
    return a.includes(b);
  }
}

export async function searchSnapshots(
  options: SearchOptions,
  snapshotNames?: string[]
): Promise<SearchResult[]> {
  const names = snapshotNames ?? (await listSnapshots());
  const results: SearchResult[] = [];
  const caseSensitive = options.caseSensitive ?? false;

  for (const name of names) {
    const snapshot = await loadSnapshot(name);
    if (!snapshot) continue;

    for (const [key, value] of Object.entries(snapshot)) {
      const keyMatch = options.keyPattern
        ? matchesPattern(key, options.keyPattern, caseSensitive)
        : true;
      const valueMatch = options.valuePattern
        ? matchesPattern(value, options.valuePattern, caseSensitive)
        : true;

      if (keyMatch && valueMatch) {
        results.push({ snapshotName: name, key, value });
      }
    }
  }

  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return 'No matches found.';

  const lines: string[] = [];
  let currentSnapshot = '';

  for (const { snapshotName, key, value } of results) {
    if (snapshotName !== currentSnapshot) {
      if (currentSnapshot !== '') lines.push('');
      lines.push(`[${snapshotName}]`);
      currentSnapshot = snapshotName;
    }
    lines.push(`  ${key}=${value}`);
  }

  return lines.join('\n');
}

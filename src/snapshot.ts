import * as fs from 'fs';
import * as path from 'path';

export const SNAPSHOTS_DIR = path.resolve(process.cwd(), '.snapenv');

export function ensureSnapshotsDir(): void {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

export function captureEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );
}

export function saveSnapshot(name: string, env: Record<string, string>): string {
  ensureSnapshotsDir();
  const filePath = path.join(SNAPSHOTS_DIR, `${name}.json`);
  const payload = {
    name,
    timestamp: new Date().toISOString(),
    env,
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  return filePath;
}

export interface Snapshot {
  name: string;
  timestamp: string;
  env: Record<string, string>;
}

export function loadSnapshot(name: string): Snapshot {
  const filePath = path.join(SNAPSHOTS_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot "${name}" not found.`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Snapshot;
}

export function listSnapshots(): string[] {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.json') && f !== 'tags.json')
    .map(f => f.replace(/\.json$/, ''))
    .sort();
}

export function deleteSnapshot(name: string): boolean {
  const filePath = path.join(SNAPSHOTS_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    return false;
  }
  fs.unlinkSync(filePath);
  return true;
}

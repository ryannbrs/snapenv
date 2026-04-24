import * as fs from 'fs';
import * as path from 'path';

export interface Snapshot {
  name: string;
  createdAt: string;
  env: Record<string, string>;
}

const SNAPSHOTS_DIR = path.join(process.cwd(), '.snapenv');

export function ensureSnapshotsDir(): void {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

export function captureEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

export function saveSnapshot(name: string, env: Record<string, string>): Snapshot {
  ensureSnapshotsDir();
  const snapshot: Snapshot = {
    name,
    createdAt: new Date().toISOString(),
    env,
  };
  const filePath = path.join(SNAPSHOTS_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return snapshot;
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
  ensureSnapshotsDir();
  return fs
    .readdirSync(SNAPSHOTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
}

export function deleteSnapshot(name: string): void {
  const filePath = path.join(SNAPSHOTS_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot "${name}" not found.`);
  }
  fs.unlinkSync(filePath);
}

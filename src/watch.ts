import * as fs from 'fs';
import * as path from 'path';
import { captureEnv, saveSnapshot } from './snapshot';
import { appendAuditEntry } from './audit';

export interface WatchOptions {
  interval: number; // milliseconds
  label?: string;
  onChange?: (snapshotName: string) => void;
}

let watchTimer: NodeJS.Timeout | null = null;
let lastEnvHash: string | null = null;

function hashEnv(env: Record<string, string>): string {
  const sorted = Object.keys(env)
    .sort()
    .map((k) => `${k}=${env[k]}`)
    .join('\n');
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const chr = sorted.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString(16);
}

export function startWatch(options: WatchOptions): void {
  if (watchTimer !== null) {
    throw new Error('Watch is already running. Call stopWatch() first.');
  }

  const { interval, label = 'watch', onChange } = options;

  lastEnvHash = hashEnv(captureEnv());

  watchTimer = setInterval(() => {
    const current = captureEnv();
    const currentHash = hashEnv(current);

    if (currentHash !== lastEnvHash) {
      lastEnvHash = currentHash;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const snapshotName = `${label}-${timestamp}`;
      saveSnapshot(snapshotName, current);
      appendAuditEntry({
        action: 'watch-capture',
        snapshot: snapshotName,
        timestamp: new Date().toISOString(),
      });
      if (onChange) {
        onChange(snapshotName);
      }
    }
  }, interval);
}

export function stopWatch(): void {
  if (watchTimer !== null) {
    clearInterval(watchTimer);
    watchTimer = null;
    lastEnvHash = null;
  }
}

export function isWatching(): boolean {
  return watchTimer !== null;
}

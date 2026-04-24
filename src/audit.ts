import * as fs from 'fs';
import * as path from 'path';
import { ensureSnapshotsDir } from './snapshot';

export interface AuditEntry {
  timestamp: string;
  action: 'capture' | 'restore' | 'delete' | 'import' | 'export' | 'tag' | 'encrypt';
  snapshotName: string;
  details?: string;
}

const AUDIT_FILE = '.snapenv/audit.log';

export function loadAuditLog(): AuditEntry[] {
  ensureSnapshotsDir();
  if (!fs.existsSync(AUDIT_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(AUDIT_FILE, 'utf-8').trim();
  if (!raw) return [];
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditEntry);
}

export function appendAuditEntry(
  action: AuditEntry['action'],
  snapshotName: string,
  details?: string
): void {
  ensureSnapshotsDir();
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    action,
    snapshotName,
    ...(details !== undefined ? { details } : {}),
  };
  fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n', 'utf-8');
}

export function clearAuditLog(): void {
  if (fs.existsSync(AUDIT_FILE)) {
    fs.writeFileSync(AUDIT_FILE, '', 'utf-8');
  }
}

export function formatAuditLog(entries: AuditEntry[]): string {
  if (entries.length === 0) {
    return 'No audit entries found.';
  }
  return entries
    .map((e) => {
      const base = `[${e.timestamp}] ${e.action.toUpperCase().padEnd(8)} ${e.snapshotName}`;
      return e.details ? `${base} — ${e.details}` : base;
    })
    .join('\n');
}

export function filterAuditLog(
  entries: AuditEntry[],
  opts: { action?: AuditEntry['action']; snapshotName?: string }
): AuditEntry[] {
  return entries.filter((e) => {
    if (opts.action && e.action !== opts.action) return false;
    if (opts.snapshotName && e.snapshotName !== opts.snapshotName) return false;
    return true;
  });
}

import * as fs from 'fs';
import * as path from 'path';
import {
  loadAuditLog,
  appendAuditEntry,
  clearAuditLog,
  formatAuditLog,
  filterAuditLog,
} from './audit';

const AUDIT_FILE = '.snapenv/audit.log';

function cleanup() {
  if (fs.existsSync(AUDIT_FILE)) {
    fs.unlinkSync(AUDIT_FILE);
  }
}

beforeEach(cleanup);
afterAll(cleanup);

describe('loadAuditLog', () => {
  it('returns empty array when log does not exist', () => {
    expect(loadAuditLog()).toEqual([]);
  });

  it('returns entries after appending', () => {
    appendAuditEntry('capture', 'dev');
    const entries = loadAuditLog();
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('capture');
    expect(entries[0].snapshotName).toBe('dev');
  });
});

describe('appendAuditEntry', () => {
  it('stores timestamp as ISO string', () => {
    appendAuditEntry('restore', 'prod', 'manual restore');
    const entries = loadAuditLog();
    expect(new Date(entries[0].timestamp).toISOString()).toBe(entries[0].timestamp);
  });

  it('stores optional details', () => {
    appendAuditEntry('export', 'staging', 'dotenv format');
    const entries = loadAuditLog();
    expect(entries[0].details).toBe('dotenv format');
  });

  it('omits details key when not provided', () => {
    appendAuditEntry('tag', 'dev');
    const entries = loadAuditLog();
    expect('details' in entries[0]).toBe(false);
  });
});

describe('clearAuditLog', () => {
  it('empties the log file', () => {
    appendAuditEntry('capture', 'dev');
    clearAuditLog();
    expect(loadAuditLog()).toEqual([]);
  });
});

describe('formatAuditLog', () => {
  it('returns message when no entries', () => {
    expect(formatAuditLog([])).toBe('No audit entries found.');
  });

  it('formats entries with action and name', () => {
    appendAuditEntry('capture', 'dev');
    const entries = loadAuditLog();
    const output = formatAuditLog(entries);
    expect(output).toContain('CAPTURE');
    expect(output).toContain('dev');
  });
});

describe('filterAuditLog', () => {
  it('filters by action', () => {
    appendAuditEntry('capture', 'dev');
    appendAuditEntry('restore', 'prod');
    const entries = loadAuditLog();
    const filtered = filterAuditLog(entries, { action: 'restore' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].snapshotName).toBe('prod');
  });

  it('filters by snapshotName', () => {
    appendAuditEntry('capture', 'dev');
    appendAuditEntry('capture', 'prod');
    const entries = loadAuditLog();
    const filtered = filterAuditLog(entries, { snapshotName: 'dev' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].snapshotName).toBe('dev');
  });
});

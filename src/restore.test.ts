import * as fs from 'fs';
import * as path from 'path';
import { restoreSnapshot, formatRestoreResult } from './restore';
import { saveSnapshot } from './snapshot';

const TEST_SNAPSHOTS_DIR = path.join(process.cwd(), '.snapenv');
const TEST_ENV_FILE = path.join(process.cwd(), '.env.test-restore');

function cleanup() {
  if (fs.existsSync(TEST_ENV_FILE)) fs.unlinkSync(TEST_ENV_FILE);
  const snapshotFile = path.join(TEST_SNAPSHOTS_DIR, 'restore-test.json');
  if (fs.existsSync(snapshotFile)) fs.unlinkSync(snapshotFile);
}

beforeEach(() => {
  cleanup();
  saveSnapshot('restore-test', { NODE_ENV: 'test', PORT: '3000', DEBUG: 'true' });
});

afterEach(cleanup);

describe('restoreSnapshot', () => {
  it('writes env vars to output file', () => {
    const result = restoreSnapshot('restore-test', { outputFile: '.env.test-restore' });
    expect(Object.keys(result.applied)).toHaveLength(3);
    expect(result.skipped).toEqual({});
    expect(fs.existsSync(TEST_ENV_FILE)).toBe(true);
    const content = fs.readFileSync(TEST_ENV_FILE, 'utf-8');
    expect(content).toContain('NODE_ENV=test');
    expect(content).toContain('PORT=3000');
  });

  it('skips existing keys when overwrite is false', () => {
    fs.writeFileSync(TEST_ENV_FILE, 'PORT=8080\n', 'utf-8');
    const result = restoreSnapshot('restore-test', {
      outputFile: '.env.test-restore',
      overwrite: false,
    });
    expect(result.skipped).toHaveProperty('PORT');
    expect(result.applied).not.toHaveProperty('PORT');
    const content = fs.readFileSync(TEST_ENV_FILE, 'utf-8');
    expect(content).toContain('PORT=8080');
  });

  it('does not write file in dry-run mode', () => {
    const result = restoreSnapshot('restore-test', {
      outputFile: '.env.test-restore',
      dryRun: true,
    });
    expect(result.applied).toHaveProperty('NODE_ENV', 'test');
    expect(result.outputPath).toBeUndefined();
    expect(fs.existsSync(TEST_ENV_FILE)).toBe(false);
  });

  it('throws when snapshot does not exist', () => {
    expect(() =>
      restoreSnapshot('nonexistent-snapshot', { outputFile: '.env.test-restore' })
    ).toThrow();
  });
});

describe('formatRestoreResult', () => {
  it('formats applied and skipped vars', () => {
    const result = {
      applied: { NODE_ENV: 'test', PORT: '3000' },
      skipped: { DEBUG: 'true' },
      outputPath: '/project/.env',
    };
    const output = formatRestoreResult(result);
    expect(output).toContain('Applied (2)');
    expect(output).toContain('+ NODE_ENV=test');
    expect(output).toContain('Skipped (1)');
    expect(output).toContain('~ DEBUG (already set)');
    expect(output).toContain('Written to: /project/.env');
  });

  it('handles empty result gracefully', () => {
    const output = formatRestoreResult({ applied: {}, skipped: {} });
    expect(output).toContain('No environment variables to restore.');
  });
});

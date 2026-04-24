import * as fs from 'fs';
import * as path from 'path';
import { parseDotenv, parseShellExport, importSnapshot } from './import';
import { loadSnapshot, listSnapshots } from './snapshot';

const TEST_DIR = path.join(__dirname, '..', '.snapshots-test-import');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

beforeEach(() => {
  process.env.SNAPENV_DIR = TEST_DIR;
  cleanup();
});

afterAll(() => {
  cleanup();
  delete process.env.SNAPENV_DIR;
});

describe('parseDotenv', () => {
  it('parses simple key=value pairs', () => {
    const result = parseDotenv('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('strips surrounding quotes', () => {
    const result = parseDotenv('FOO="hello world"\nBAR=\'single\'');
    expect(result).toEqual({ FOO: 'hello world', BAR: 'single' });
  });

  it('ignores comments and blank lines', () => {
    const result = parseDotenv('# comment\n\nFOO=bar');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('handles values containing equals signs', () => {
    const result = parseDotenv('URL=http://example.com?a=1&b=2');
    expect(result.URL).toBe('http://example.com?a=1&b=2');
  });
});

describe('parseShellExport', () => {
  it('parses export statements', () => {
    const result = parseShellExport('export FOO=bar\nexport BAZ="hello"');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'hello' });
  });

  it('ignores non-export lines', () => {
    const result = parseShellExport('FOO=bar\nexport VALID=yes');
    expect(result).toEqual({ VALID: 'yes' });
  });
});

describe('importSnapshot', () => {
  const tmpFile = path.join(__dirname, 'test-import.env');

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('imports a dotenv file and saves a snapshot', () => {
    fs.writeFileSync(tmpFile, 'APP_ENV=production\nPORT=3000');
    const result = importSnapshot(tmpFile, 'imported', 'dotenv');
    expect(result.count).toBe(2);
    expect(result.skipped).toHaveLength(0);
    const snap = loadSnapshot('imported');
    expect(snap).toEqual({ APP_ENV: 'production', PORT: '3000' });
  });

  it('reports skipped keys with invalid names', () => {
    fs.writeFileSync(tmpFile, 'VALID=yes\n123INVALID=no');
    const result = importSnapshot(tmpFile, 'skip-test', 'dotenv');
    expect(result.skipped).toContain('123INVALID');
    expect(result.count).toBe(1);
  });
});

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  encryptSnapshot,
  decryptSnapshot,
  saveEncryptedSnapshot,
  loadEncryptedSnapshot,
  isEncryptedSnapshot,
} from './encrypt';

const TEST_DIR = path.join(os.tmpdir(), 'snapenv-encrypt-test');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

beforeEach(() => {
  cleanup();
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(cleanup);

const PASSPHRASE = 'super-secret-passphrase';
const PLAINTEXT = JSON.stringify({ NODE_ENV: 'production', API_KEY: 'abc123', PORT: '8080' });

describe('encryptSnapshot / decryptSnapshot', () => {
  it('round-trips plaintext correctly', () => {
    const encrypted = encryptSnapshot(PLAINTEXT, PASSPHRASE);
    const decrypted = decryptSnapshot(encrypted, PASSPHRASE);
    expect(decrypted).toBe(PLAINTEXT);
  });

  it('produces different ciphertext on each call (random IV/salt)', () => {
    const a = encryptSnapshot(PLAINTEXT, PASSPHRASE);
    const b = encryptSnapshot(PLAINTEXT, PASSPHRASE);
    expect(a.equals(b)).toBe(false);
  });

  it('throws on wrong passphrase', () => {
    const encrypted = encryptSnapshot(PLAINTEXT, PASSPHRASE);
    expect(() => decryptSnapshot(encrypted, 'wrong-passphrase')).toThrow(
      'Decryption failed: wrong passphrase or corrupted data'
    );
  });

  it('throws on truncated buffer', () => {
    const short = Buffer.alloc(10);
    expect(() => decryptSnapshot(short, PASSPHRASE)).toThrow('Invalid encrypted data');
  });
});

describe('saveEncryptedSnapshot / loadEncryptedSnapshot', () => {
  it('saves and loads an encrypted snapshot', () => {
    saveEncryptedSnapshot(TEST_DIR, 'mysnap', PLAINTEXT, PASSPHRASE);
    const loaded = loadEncryptedSnapshot(TEST_DIR, 'mysnap', PASSPHRASE);
    expect(loaded).toBe(PLAINTEXT);
  });

  it('throws when snapshot file does not exist', () => {
    expect(() => loadEncryptedSnapshot(TEST_DIR, 'missing', PASSPHRASE)).toThrow(
      'Encrypted snapshot not found: missing'
    );
  });
});

describe('isEncryptedSnapshot', () => {
  it('returns true when .enc file exists', () => {
    saveEncryptedSnapshot(TEST_DIR, 'secure', PLAINTEXT, PASSPHRASE);
    expect(isEncryptedSnapshot(TEST_DIR, 'secure')).toBe(true);
  });

  it('returns false when no .enc file exists', () => {
    expect(isEncryptedSnapshot(TEST_DIR, 'nonexistent')).toBe(false);
  });
});

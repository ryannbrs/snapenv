import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

export function encryptSnapshot(plaintext: string, passphrase: string): Buffer {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Layout: salt (16) + iv (12) + tag (16) + ciphertext
  return Buffer.concat([salt, iv, tag, encrypted]);
}

export function decryptSnapshot(data: Buffer, passphrase: string): string {
  if (data.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid encrypted data: buffer too short');
  }

  let offset = 0;
  const salt = data.slice(offset, offset + SALT_LENGTH); offset += SALT_LENGTH;
  const iv = data.slice(offset, offset + IV_LENGTH); offset += IV_LENGTH;
  const tag = data.slice(offset, offset + TAG_LENGTH); offset += TAG_LENGTH;
  const ciphertext = data.slice(offset);

  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    return decipher.update(ciphertext) + decipher.final('utf8');
  } catch {
    throw new Error('Decryption failed: wrong passphrase or corrupted data');
  }
}

export function saveEncryptedSnapshot(snapshotsDir: string, name: string, data: string, passphrase: string): void {
  const encrypted = encryptSnapshot(data, passphrase);
  const filePath = path.join(snapshotsDir, `${name}.enc`);
  fs.writeFileSync(filePath, encrypted);
}

export function loadEncryptedSnapshot(snapshotsDir: string, name: string, passphrase: string): string {
  const filePath = path.join(snapshotsDir, `${name}.enc`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Encrypted snapshot not found: ${name}`);
  }
  const data = fs.readFileSync(filePath);
  return decryptSnapshot(data, passphrase);
}

export function isEncryptedSnapshot(snapshotsDir: string, name: string): boolean {
  return fs.existsSync(path.join(snapshotsDir, `${name}.enc`));
}

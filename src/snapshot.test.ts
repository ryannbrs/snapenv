import * as fs from 'fs';
import * as path from 'path';
import {
  captureEnv,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
} from './snapshot';

const SNAPSHOTS_DIR = path.join(process.cwd(), '.snapenv');

function cleanup(name: string) {
  const filePath = path.join(SNAPSHOTS_DIR, `${name}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

describe('snapshot module', () => {
  const TEST_SNAPSHOT = 'test-snap';

  afterEach(() => cleanup(TEST_SNAPSHOT));

  test('captureEnv returns an object of string key-value pairs', () => {
    const env = captureEnv();
    expect(typeof env).toBe('object');
    for (const [k, v] of Object.entries(env)) {
      expect(typeof k).toBe('string');
      expect(typeof v).toBe('string');
    }
  });

  test('saveSnapshot writes a JSON file and returns snapshot', () => {
    const env = { FOO: 'bar', BAZ: '42' };
    const snap = saveSnapshot(TEST_SNAPSHOT, env);
    expect(snap.name).toBe(TEST_SNAPSHOT);
    expect(snap.env).toEqual(env);
    expect(typeof snap.createdAt).toBe('string');
    const filePath = path.join(SNAPSHOTS_DIR, `${TEST_SNAPSHOT}.json`);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('loadSnapshot reads back a saved snapshot', () => {
    const env = { NODE_ENV: 'test' };
    saveSnapshot(TEST_SNAPSHOT, env);
    const loaded = loadSnapshot(TEST_SNAPSHOT);
    expect(loaded.name).toBe(TEST_SNAPSHOT);
    expect(loaded.env).toEqual(env);
  });

  test('loadSnapshot throws for missing snapshot', () => {
    expect(() => loadSnapshot('nonexistent-snap')).toThrow();
  });

  test('listSnapshots includes saved snapshot', () => {
    saveSnapshot(TEST_SNAPSHOT, {});
    const list = listSnapshots();
    expect(list).toContain(TEST_SNAPSHOT);
  });

  test('deleteSnapshot removes the snapshot file', () => {
    saveSnapshot(TEST_SNAPSHOT, {});
    deleteSnapshot(TEST_SNAPSHOT);
    const filePath = path.join(SNAPSHOTS_DIR, `${TEST_SNAPSHOT}.json`);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  test('deleteSnapshot throws for missing snapshot', () => {
    expect(() => deleteSnapshot('nonexistent-snap')).toThrow();
  });
});

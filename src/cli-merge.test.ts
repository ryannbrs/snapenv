import * as fs from 'fs';
import * as path from 'path';
import { handleMergeCommand, printMergeHelp } from './cli-merge';
import { saveSnapshot, ensureSnapshotsDir, loadSnapshot } from './snapshot';

const TEST_DIR = path.join(__dirname, '../.snapshots-test-cli-merge');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

beforeEach(() => {
  cleanup();
  process.env.SNAPENV_DIR = TEST_DIR;
  ensureSnapshotsDir();
});

afterEach(() => {
  cleanup();
  delete process.env.SNAPENV_DIR;
});

describe('handleMergeCommand', () => {
  test('prints help when --help flag is passed', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await handleMergeCommand(['--help']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('snapenv merge'));
    spy.mockRestore();
  });

  test('prints help when no args are passed', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await handleMergeCommand([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('exits with error when missing arguments', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(handleMergeCommand(['only-one'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('requires'));
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('merges two snapshots and logs result', async () => {
    await saveSnapshot('snap-a', { FOO: 'bar' });
    await saveSnapshot('snap-b', { BAZ: 'qux' });
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    await handleMergeCommand(['snap-a', 'snap-b', 'snap-merged']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('snap-merged'));
    const merged = await loadSnapshot('snap-merged');
    expect(merged).toEqual({ FOO: 'bar', BAZ: 'qux' });
    logSpy.mockRestore();
  });

  test('respects --strategy=base on conflict', async () => {
    await saveSnapshot('snap-x', { KEY: 'original' });
    await saveSnapshot('snap-y', { KEY: 'override' });
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    await handleMergeCommand(['snap-x', 'snap-y', 'snap-out', '--strategy=base']);
    const merged = await loadSnapshot('snap-out');
    expect(merged.KEY).toBe('original');
    logSpy.mockRestore();
  });

  test('exits on invalid strategy', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      handleMergeCommand(['a', 'b', 'c', '--strategy=invalid'])
    ).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('invalid strategy'));
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

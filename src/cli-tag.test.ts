import * as fs from 'fs';
import * as path from 'path';
import { handleTagCommand } from './cli-tag';
import { addTag, loadTags } from './tag';
import { saveSnapshot, SNAPSHOTS_DIR } from './snapshot';

const TAGS_FILE = path.join(SNAPSHOTS_DIR, 'tags.json');

function cleanup() {
  if (fs.existsSync(TAGS_FILE)) fs.unlinkSync(TAGS_FILE);
  const snaps = fs.existsSync(SNAPSHOTS_DIR) ? fs.readdirSync(SNAPSHOTS_DIR) : [];
  snaps.filter(f => f.endsWith('.json') && f !== 'tags.json').forEach(f =>
    fs.unlinkSync(path.join(SNAPSHOTS_DIR, f))
  );
}

describe('cli-tag handleTagCommand', () => {
  beforeEach(() => cleanup());
  afterAll(() => cleanup());

  test('add creates a tag for an existing snapshot', () => {
    saveSnapshot('snap-test-01', { FOO: 'bar' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    handleTagCommand(['add', 'mytag', 'snap-test-01']);
    expect(loadTags()['mytag']).toBe('snap-test-01');
    spy.mockRestore();
  });

  test('add exits with error when snapshot does not exist', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => handleTagCommand(['add', 'mytag', 'nonexistent'])).toThrow('exit');
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  test('remove deletes an existing tag', () => {
    saveSnapshot('snap-rm-01', { A: '1' });
    addTag('todelete', 'snap-rm-01');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    handleTagCommand(['remove', 'todelete']);
    expect(loadTags()['todelete']).toBeUndefined();
    spy.mockRestore();
  });

  test('list prints tag list', () => {
    saveSnapshot('snap-list-01', { X: 'y' });
    addTag('listtag', 'snap-list-01');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    handleTagCommand(['list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('listtag'));
    spy.mockRestore();
  });

  test('resolve prints resolved snapshot name', () => {
    saveSnapshot('snap-res-01', { R: 's' });
    addTag('resolveme', 'snap-res-01');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    handleTagCommand(['resolve', 'resolveme']);
    expect(spy).toHaveBeenCalledWith('snap-res-01');
    spy.mockRestore();
  });

  test('unknown subcommand exits with error', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => handleTagCommand(['unknown'])).toThrow('exit');
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});

import { startWatch, stopWatch, isWatching } from './watch';
import { loadSnapshot, listSnapshots } from './snapshot';
import * as fs from 'fs';
import * as path from 'path';

const SNAPSHOTS_DIR = path.join(process.cwd(), '.snapenv');

function cleanup() {
  if (fs.existsSync(SNAPSHOTS_DIR)) {
    fs.rmSync(SNAPSHOTS_DIR, { recursive: true, force: true });
  }
  stopWatch();
}

describe('watch', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('should report not watching initially', () => {
    expect(isWatching()).toBe(false);
  });

  it('should report watching after startWatch', () => {
    startWatch({ interval: 10000, label: 'test' });
    expect(isWatching()).toBe(true);
  });

  it('should report not watching after stopWatch', () => {
    startWatch({ interval: 10000, label: 'test' });
    stopWatch();
    expect(isWatching()).toBe(false);
  });

  it('should throw if startWatch called twice', () => {
    startWatch({ interval: 10000, label: 'test' });
    expect(() => startWatch({ interval: 10000 })).toThrow(
      'Watch is already running'
    );
  });

  it('should capture snapshot when env changes', (done) => {
    const originalVal = process.env.SNAPENV_TEST_VAR;
    process.env.SNAPENV_TEST_VAR = 'initial';

    startWatch({
      interval: 50,
      label: 'envchange',
      onChange: (name) => {
        stopWatch();
        expect(name).toMatch(/^envchange-/);
        const snapshots = listSnapshots();
        expect(snapshots.some((s) => s === name)).toBe(true);
        const data = loadSnapshot(name);
        expect(data['SNAPENV_TEST_VAR']).toBe('changed');
        process.env.SNAPENV_TEST_VAR = originalVal;
        done();
      },
    });

    setTimeout(() => {
      process.env.SNAPENV_TEST_VAR = 'changed';
    }, 60);
  });

  it('should not capture snapshot when env is unchanged', (done) => {
    const before = listSnapshots().length;
    startWatch({ interval: 50, label: 'nochange' });
    setTimeout(() => {
      stopWatch();
      const after = listSnapshots().length;
      expect(after).toBe(before);
      done();
    }, 200);
  });
});

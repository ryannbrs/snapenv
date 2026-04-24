import * as fs from 'fs';
import * as path from 'path';
import {
  addSchedule,
  removeSchedule,
  listSchedules,
  updateLastRun,
  loadSchedules,
} from './schedule';

const SNAPENV_DIR = path.join('.snapenv');
const SCHEDULE_FILE = path.join(SNAPENV_DIR, 'schedules.json');

function cleanup() {
  if (fs.existsSync(SCHEDULE_FILE)) fs.unlinkSync(SCHEDULE_FILE);
}

describe('schedule', () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  test('addSchedule creates a new entry', () => {
    const entry = addSchedule('0 * * * *', 'hourly');
    expect(entry.cronExpression).toBe('0 * * * *');
    expect(entry.label).toBe('hourly');
    expect(entry.id).toMatch(/^sched_/);
    expect(entry.createdAt).toBeTruthy();
  });

  test('listSchedules returns all added entries', () => {
    addSchedule('0 0 * * *', 'daily');
    addSchedule('0 0 * * 0', 'weekly');
    const list = listSchedules();
    expect(list).toHaveLength(2);
    expect(list[0].label).toBe('daily');
    expect(list[1].label).toBe('weekly');
  });

  test('removeSchedule removes entry by id', () => {
    const entry = addSchedule('*/5 * * * *', 'every5min');
    const removed = removeSchedule(entry.id);
    expect(removed).toBe(true);
    expect(listSchedules()).toHaveLength(0);
  });

  test('removeSchedule returns false for unknown id', () => {
    const removed = removeSchedule('nonexistent_id');
    expect(removed).toBe(false);
  });

  test('updateLastRun sets lastRun on entry', () => {
    const entry = addSchedule('0 12 * * *');
    const ts = new Date().toISOString();
    const updated = updateLastRun(entry.id, ts);
    expect(updated).toBe(true);
    const store = loadSchedules();
    expect(store.schedules[0].lastRun).toBe(ts);
  });

  test('updateLastRun returns false for unknown id', () => {
    const result = updateLastRun('bad_id', new Date().toISOString());
    expect(result).toBe(false);
  });
});

import * as fs from 'fs';
import * as path from 'path';
import { handleScheduleCommand } from './cli-schedule';
import { addSchedule } from './schedule';

const SCHEDULE_FILE = path.join('.snapenv', 'schedules.json');

function cleanup() {
  if (fs.existsSync(SCHEDULE_FILE)) fs.unlinkSync(SCHEDULE_FILE);
}

describe('handleScheduleCommand', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    cleanup();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  afterAll(cleanup);

  test('list with no schedules prints empty message', () => {
    handleScheduleCommand(['list']);
    expect(logSpy).toHaveBeenCalledWith('No schedules configured.');
  });

  test('add creates a schedule and prints confirmation', () => {
    handleScheduleCommand(['add', '0 * * * *', 'hourly']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Schedule added:/));
  });

  test('list shows added schedules', () => {
    addSchedule('0 0 * * *', 'daily');
    handleScheduleCommand(['list']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Schedules \(1\)/));
  });

  test('remove deletes an existing schedule', () => {
    const entry = addSchedule('*/10 * * * *');
    handleScheduleCommand(['remove', entry.id]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/removed/));
  });

  test('remove unknown id exits with error', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => handleScheduleCommand(['remove', 'no_such_id'])).toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/not found/));
    exitSpy.mockRestore();
  });

  test('add without cron exits with error', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => handleScheduleCommand(['add'])).toThrow('exit');
    exitSpy.mockRestore();
  });
});

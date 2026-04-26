import fs from 'fs';
import path from 'path';
import { handleProfileCommand } from './cli-profile';
import { loadProfiles } from './profile';

const PROFILES_FILE = path.join(process.cwd(), '.snapenv', 'profiles.json');

function cleanup() {
  if (fs.existsSync(PROFILES_FILE)) fs.unlinkSync(PROFILES_FILE);
}

beforeEach(cleanup);
afterAll(cleanup);

describe('handleProfileCommand - create', () => {
  it('creates a profile and prints confirmation', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    handleProfileCommand(['create', 'myprofile', 'My profile desc']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('myprofile'));
    spy.mockRestore();
  });

  it('exits with error when name is missing', () => {
    const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => handleProfileCommand(['create'])).toThrow('exit');
    spy.mockRestore();
  });
});

describe('handleProfileCommand - delete', () => {
  it('deletes an existing profile', () => {
    handleProfileCommand(['create', 'todelete']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    handleProfileCommand(['delete', 'todelete']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('deleted'));
    spy.mockRestore();
  });

  it('exits with error for missing profile', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => handleProfileCommand(['delete', 'ghost'])).toThrow('exit');
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});

describe('handleProfileCommand - add-snapshot / remove-snapshot', () => {
  it('adds and removes a snapshot from a profile', () => {
    handleProfileCommand(['create', 'envprofile']);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    handleProfileCommand(['add-snapshot', 'envprofile', 'snap-abc']);
    let store = loadProfiles();
    expect(store.profiles['envprofile'].snapshotIds).toContain('snap-abc');
    handleProfileCommand(['remove-snapshot', 'envprofile', 'snap-abc']);
    store = loadProfiles();
    expect(store.profiles['envprofile'].snapshotIds).not.toContain('snap-abc');
    logSpy.mockRestore();
  });
});

describe('handleProfileCommand - list', () => {
  it('prints no profiles message when empty', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    handleProfileCommand(['list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No profiles'));
    spy.mockRestore();
  });

  it('lists created profiles', () => {
    handleProfileCommand(['create', 'alpha']);
    handleProfileCommand(['create', 'beta', 'Beta env']);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    handleProfileCommand(['list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('alpha'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('beta'));
    spy.mockRestore();
  });
});

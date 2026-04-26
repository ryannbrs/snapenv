import fs from 'fs';
import path from 'path';
import {
  loadProfiles,
  createProfile,
  deleteProfile,
  addSnapshotToProfile,
  removeSnapshotFromProfile,
  listProfiles,
} from './profile';

const SNAPENV_DIR = path.join(process.cwd(), '.snapenv');
const PROFILES_FILE = path.join(SNAPENV_DIR, 'profiles.json');

function cleanup() {
  if (fs.existsSync(PROFILES_FILE)) fs.unlinkSync(PROFILES_FILE);
}

beforeEach(cleanup);
afterAll(cleanup);

describe('loadProfiles', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadProfiles();
    expect(store.profiles).toEqual({});
  });
});

describe('createProfile', () => {
  it('creates a new profile', () => {
    const profile = createProfile('dev', 'Development env');
    expect(profile.name).toBe('dev');
    expect(profile.description).toBe('Development env');
    expect(profile.snapshotIds).toEqual([]);
  });

  it('throws if profile already exists', () => {
    createProfile('staging');
    expect(() => createProfile('staging')).toThrow('already exists');
  });
});

describe('deleteProfile', () => {
  it('deletes an existing profile and returns true', () => {
    createProfile('temp');
    expect(deleteProfile('temp')).toBe(true);
    expect(listProfiles().find(p => p.name === 'temp')).toBeUndefined();
  });

  it('returns false when profile does not exist', () => {
    expect(deleteProfile('nonexistent')).toBe(false);
  });
});

describe('addSnapshotToProfile / removeSnapshotFromProfile', () => {
  it('adds a snapshot id to a profile', () => {
    createProfile('prod');
    const updated = addSnapshotToProfile('prod', 'snap-001');
    expect(updated.snapshotIds).toContain('snap-001');
  });

  it('does not duplicate snapshot ids', () => {
    createProfile('prod2');
    addSnapshotToProfile('prod2', 'snap-002');
    addSnapshotToProfile('prod2', 'snap-002');
    const store = loadProfiles();
    expect(store.profiles['prod2'].snapshotIds.length).toBe(1);
  });

  it('removes a snapshot id from a profile', () => {
    createProfile('qa');
    addSnapshotToProfile('qa', 'snap-003');
    const updated = removeSnapshotFromProfile('qa', 'snap-003');
    expect(updated.snapshotIds).not.toContain('snap-003');
  });

  it('throws when profile not found', () => {
    expect(() => addSnapshotToProfile('missing', 'snap-x')).toThrow('not found');
  });
});

describe('listProfiles', () => {
  it('returns all profiles', () => {
    createProfile('alpha');
    createProfile('beta');
    const profiles = listProfiles();
    expect(profiles.map(p => p.name)).toEqual(expect.arrayContaining(['alpha', 'beta']));
  });
});

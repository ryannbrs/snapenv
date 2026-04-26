import fs from 'fs';
import path from 'path';
import { ensureSnapshotsDir } from './snapshot';

export interface Profile {
  name: string;
  description?: string;
  snapshotIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileStore {
  profiles: Record<string, Profile>;
}

const PROFILES_FILE = path.join(process.cwd(), '.snapenv', 'profiles.json');

export function loadProfiles(): ProfileStore {
  ensureSnapshotsDir();
  if (!fs.existsSync(PROFILES_FILE)) {
    return { profiles: {} };
  }
  const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
  return JSON.parse(raw) as ProfileStore;
}

export function saveProfiles(store: ProfileStore): void {
  ensureSnapshotsDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export function createProfile(name: string, description?: string): Profile {
  const store = loadProfiles();
  if (store.profiles[name]) {
    throw new Error(`Profile "${name}" already exists`);
  }
  const now = new Date().toISOString();
  const profile: Profile = { name, description, snapshotIds: [], createdAt: now, updatedAt: now };
  store.profiles[name] = profile;
  saveProfiles(store);
  return profile;
}

export function deleteProfile(name: string): boolean {
  const store = loadProfiles();
  if (!store.profiles[name]) return false;
  delete store.profiles[name];
  saveProfiles(store);
  return true;
}

export function addSnapshotToProfile(profileName: string, snapshotId: string): Profile {
  const store = loadProfiles();
  const profile = store.profiles[profileName];
  if (!profile) throw new Error(`Profile "${profileName}" not found`);
  if (!profile.snapshotIds.includes(snapshotId)) {
    profile.snapshotIds.push(snapshotId);
    profile.updatedAt = new Date().toISOString();
    saveProfiles(store);
  }
  return profile;
}

export function removeSnapshotFromProfile(profileName: string, snapshotId: string): Profile {
  const store = loadProfiles();
  const profile = store.profiles[profileName];
  if (!profile) throw new Error(`Profile "${profileName}" not found`);
  profile.snapshotIds = profile.snapshotIds.filter(id => id !== snapshotId);
  profile.updatedAt = new Date().toISOString();
  saveProfiles(store);
  return profile;
}

export function listProfiles(): Profile[] {
  const store = loadProfiles();
  return Object.values(store.profiles);
}

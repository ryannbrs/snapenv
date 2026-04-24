import * as fs from 'fs';
import * as path from 'path';
import { ensureSnapshotsDir } from './snapshot';

export interface ScheduleEntry {
  id: string;
  cronExpression: string;
  label?: string;
  createdAt: string;
  lastRun?: string;
}

export interface ScheduleStore {
  schedules: ScheduleEntry[];
}

const SCHEDULE_FILE = path.join('.snapenv', 'schedules.json');

export function loadSchedules(): ScheduleStore {
  ensureSnapshotsDir();
  if (!fs.existsSync(SCHEDULE_FILE)) {
    return { schedules: [] };
  }
  const raw = fs.readFileSync(SCHEDULE_FILE, 'utf-8');
  return JSON.parse(raw) as ScheduleStore;
}

export function saveSchedules(store: ScheduleStore): void {
  ensureSnapshotsDir();
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export function addSchedule(cronExpression: string, label?: string): ScheduleEntry {
  const store = loadSchedules();
  const entry: ScheduleEntry = {
    id: `sched_${Date.now()}`,
    cronExpression,
    label,
    createdAt: new Date().toISOString(),
  };
  store.schedules.push(entry);
  saveSchedules(store);
  return entry;
}

export function removeSchedule(id: string): boolean {
  const store = loadSchedules();
  const before = store.schedules.length;
  store.schedules = store.schedules.filter((s) => s.id !== id);
  if (store.schedules.length === before) return false;
  saveSchedules(store);
  return true;
}

export function updateLastRun(id: string, timestamp: string): boolean {
  const store = loadSchedules();
  const entry = store.schedules.find((s) => s.id === id);
  if (!entry) return false;
  entry.lastRun = timestamp;
  saveSchedules(store);
  return true;
}

export function listSchedules(): ScheduleEntry[] {
  return loadSchedules().schedules;
}

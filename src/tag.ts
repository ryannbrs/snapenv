import * as fs from 'fs';
import * as path from 'path';
import { SNAPSHOTS_DIR } from './snapshot';

const TAGS_FILE = path.join(SNAPSHOTS_DIR, 'tags.json');

export interface TagMap {
  [tag: string]: string; // tag -> snapshot name
}

export function loadTags(): TagMap {
  if (!fs.existsSync(TAGS_FILE)) {
    return {};
  }
  const raw = fs.readFileSync(TAGS_FILE, 'utf-8');
  return JSON.parse(raw) as TagMap;
}

export function saveTags(tags: TagMap): void {
  fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2), 'utf-8');
}

export function addTag(tag: string, snapshotName: string): void {
  const tags = loadTags();
  tags[tag] = snapshotName;
  saveTags(tags);
}

export function removeTag(tag: string): boolean {
  const tags = loadTags();
  if (!(tag in tags)) {
    return false;
  }
  delete tags[tag];
  saveTags(tags);
  return true;
}

export function resolveTag(tagOrName: string): string {
  const tags = loadTags();
  return tags[tagOrName] ?? tagOrName;
}

export function listTags(): Array<{ tag: string; snapshot: string }> {
  const tags = loadTags();
  return Object.entries(tags).map(([tag, snapshot]) => ({ tag, snapshot }));
}

export function formatTagList(tags: Array<{ tag: string; snapshot: string }>): string {
  if (tags.length === 0) {
    return 'No tags defined.';
  }
  const lines = tags.map(({ tag, snapshot }) => `  ${tag.padEnd(20)} -> ${snapshot}`);
  return ['Tags:', ...lines].join('\n');
}

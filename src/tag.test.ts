import * as fs from 'fs';
import * as path from 'path';
import { addTag, removeTag, resolveTag, listTags, formatTagList, loadTags } from './tag';
import { SNAPSHOTS_DIR } from './snapshot';

const TAGS_FILE = path.join(SNAPSHOTS_DIR, 'tags.json');

function cleanup() {
  if (fs.existsSync(TAGS_FILE)) {
    fs.unlinkSync(TAGS_FILE);
  }
  if (fs.existsSync(SNAPSHOTS_DIR) && fs.readdirSync(SNAPSHOTS_DIR).length === 0) {
    fs.rmdirSync(SNAPSHOTS_DIR);
  }
}

describe('tag module', () => {
  beforeEach(() => cleanup());
  afterAll(() => cleanup());

  test('loadTags returns empty object when no tags file exists', () => {
    expect(loadTags()).toEqual({});
  });

  test('addTag stores a tag mapping', () => {
    addTag('production', 'snap-2024-01-01');
    const tags = loadTags();
    expect(tags['production']).toBe('snap-2024-01-01');
  });

  test('addTag overwrites existing tag', () => {
    addTag('staging', 'snap-old');
    addTag('staging', 'snap-new');
    expect(loadTags()['staging']).toBe('snap-new');
  });

  test('removeTag deletes an existing tag and returns true', () => {
    addTag('dev', 'snap-dev-01');
    const result = removeTag('dev');
    expect(result).toBe(true);
    expect(loadTags()['dev']).toBeUndefined();
  });

  test('removeTag returns false for non-existent tag', () => {
    expect(removeTag('nonexistent')).toBe(false);
  });

  test('resolveTag returns snapshot name for known tag', () => {
    addTag('latest', 'snap-latest-42');
    expect(resolveTag('latest')).toBe('snap-latest-42');
  });

  test('resolveTag returns input unchanged for unknown tag', () => {
    expect(resolveTag('snap-direct-name')).toBe('snap-direct-name');
  });

  test('listTags returns all tag entries', () => {
    addTag('alpha', 'snap-a');
    addTag('beta', 'snap-b');
    const list = listTags();
    expect(list).toHaveLength(2);
    expect(list).toContainEqual({ tag: 'alpha', snapshot: 'snap-a' });
    expect(list).toContainEqual({ tag: 'beta', snapshot: 'snap-b' });
  });

  test('formatTagList returns no-tags message when empty', () => {
    expect(formatTagList([])).toBe('No tags defined.');
  });

  test('formatTagList formats tag entries', () => {
    const output = formatTagList([{ tag: 'prod', snapshot: 'snap-prod-1' }]);
    expect(output).toContain('prod');
    expect(output).toContain('snap-prod-1');
    expect(output).toContain('->');
  });
});

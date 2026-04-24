import { addTag, removeTag, listTags, formatTagList, resolveTag } from './tag';
import { listSnapshots } from './snapshot';

export function handleTagCommand(args: string[]): void {
  const subcommand = args[0];

  switch (subcommand) {
    case 'add': {
      const [, tag, snapshotName] = args;
      if (!tag || !snapshotName) {
        console.error('Usage: snapenv tag add <tag> <snapshot-name>');
        process.exit(1);
      }
      const snapshots = listSnapshots();
      if (!snapshots.includes(snapshotName)) {
        console.error(`Error: snapshot "${snapshotName}" does not exist.`);
        process.exit(1);
      }
      addTag(tag, snapshotName);
      console.log(`Tag "${tag}" -> "${snapshotName}" saved.`);
      break;
    }

    case 'remove': {
      const [, tag] = args;
      if (!tag) {
        console.error('Usage: snapenv tag remove <tag>');
        process.exit(1);
      }
      const removed = removeTag(tag);
      if (removed) {
        console.log(`Tag "${tag}" removed.`);
      } else {
        console.error(`Error: tag "${tag}" not found.`);
        process.exit(1);
      }
      break;
    }

    case 'list': {
      const tags = listTags();
      console.log(formatTagList(tags));
      break;
    }

    case 'resolve': {
      const [, tagOrName] = args;
      if (!tagOrName) {
        console.error('Usage: snapenv tag resolve <tag-or-snapshot>');
        process.exit(1);
      }
      console.log(resolveTag(tagOrName));
      break;
    }

    default:
      console.error('Unknown tag subcommand. Use: add | remove | list | resolve');
      process.exit(1);
  }
}

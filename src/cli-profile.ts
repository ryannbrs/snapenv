import {
  createProfile,
  deleteProfile,
  addSnapshotToProfile,
  removeSnapshotFromProfile,
  listProfiles,
} from './profile';

export function handleProfileCommand(args: string[]): void {
  const sub = args[0];

  switch (sub) {
    case 'create': {
      const name = args[1];
      const description = args[2];
      if (!name) {
        console.error('Usage: snapenv profile create <name> [description]');
        process.exit(1);
      }
      const profile = createProfile(name, description);
      console.log(`Profile "${profile.name}" created.`);
      break;
    }
    case 'delete': {
      const name = args[1];
      if (!name) {
        console.error('Usage: snapenv profile delete <name>');
        process.exit(1);
      }
      const removed = deleteProfile(name);
      if (removed) {
        console.log(`Profile "${name}" deleted.`);
      } else {
        console.error(`Profile "${name}" not found.`);
        process.exit(1);
      }
      break;
    }
    case 'add-snapshot': {
      const [, profileName, snapshotId] = args;
      if (!profileName || !snapshotId) {
        console.error('Usage: snapenv profile add-snapshot <profile> <snapshotId>');
        process.exit(1);
      }
      addSnapshotToProfile(profileName, snapshotId);
      console.log(`Snapshot "${snapshotId}" added to profile "${profileName}".`);
      break;
    }
    case 'remove-snapshot': {
      const [, profileName, snapshotId] = args;
      if (!profileName || !snapshotId) {
        console.error('Usage: snapenv profile remove-snapshot <profile> <snapshotId>');
        process.exit(1);
      }
      removeSnapshotFromProfile(profileName, snapshotId);
      console.log(`Snapshot "${snapshotId}" removed from profile "${profileName}".`);
      break;
    }
    case 'list': {
      const profiles = listProfiles();
      if (profiles.length === 0) {
        console.log('No profiles found.');
      } else {
        profiles.forEach(p => {
          const desc = p.description ? ` — ${p.description}` : '';
          console.log(`  ${p.name}${desc} (${p.snapshotIds.length} snapshot(s))`);
        });
      }
      break;
    }
    default:
      console.error('Unknown profile subcommand. Available: create, delete, add-snapshot, remove-snapshot, list');
      process.exit(1);
  }
}

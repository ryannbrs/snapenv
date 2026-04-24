#!/usr/bin/env node
import { captureEnv, saveSnapshot, loadSnapshot, listSnapshots, deleteSnapshot } from './snapshot';

const [, , command, ...args] = process.argv;

function printHelp() {
  console.log(`
snapenv — snapshot, diff, and restore environment variable sets

Usage:
  snapenv save <name>       Save current environment as a named snapshot
  snapenv load <name>       Print env vars from a snapshot (export-ready)
  snapenv list              List all saved snapshots
  snapenv delete <name>     Delete a named snapshot
  snapenv help              Show this help message
`);
}

switch (command) {
  case 'save': {
    const name = args[0];
    if (!name) {
      console.error('Error: Please provide a snapshot name.');
      process.exit(1);
    }
    const env = captureEnv();
    const snap = saveSnapshot(name, env);
    console.log(`✔ Snapshot "${snap.name}" saved at ${snap.createdAt} (${Object.keys(env).length} vars).`);
    break;
  }

  case 'load': {
    const name = args[0];
    if (!name) {
      console.error('Error: Please provide a snapshot name.');
      process.exit(1);
    }
    try {
      const snap = loadSnapshot(name);
      for (const [key, value] of Object.entries(snap.env)) {
        console.log(`export ${key}=${JSON.stringify(value)}`);
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    break;
  }

  case 'list': {
    const snaps = listSnapshots();
    if (snaps.length === 0) {
      console.log('No snapshots found.');
    } else {
      console.log('Saved snapshots:');
      snaps.forEach((s) => console.log(`  • ${s}`));
    }
    break;
  }

  case 'delete': {
    const name = args[0];
    if (!name) {
      console.error('Error: Please provide a snapshot name.');
      process.exit(1);
    }
    try {
      deleteSnapshot(name);
      console.log(`✔ Snapshot "${name}" deleted.`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    break;
  }

  default:
    printHelp();
    break;
}

import * as path from 'path';
import { importSnapshot, ImportFormat } from './import';

export function handleImportCommand(args: string[]): void {
  if (args.length < 2) {
    console.error(
      'Usage: snapenv import <file> <snapshot-name> [--format=dotenv|shell]'
    );
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  const snapshotName = args[1];

  let format: ImportFormat = 'dotenv';
  const formatArg = args.find((a) => a.startsWith('--format='));
  if (formatArg) {
    const val = formatArg.split('=')[1];
    if (val === 'shell' || val === 'dotenv') {
      format = val;
    } else {
      console.error(`Unknown format "${val}". Use dotenv or shell.`);
      process.exit(1);
    }
  }

  try {
    const result = importSnapshot(filePath, snapshotName, format);
    console.log(
      `✔ Imported ${result.count} variable(s) into snapshot "${result.name}".`
    );
    if (result.skipped.length > 0) {
      console.warn(
        `  Skipped ${result.skipped.length} invalid key(s): ${result.skipped.join(', ')}`
      );
    }
  } catch (err: any) {
    console.error(`Error importing snapshot: ${err.message}`);
    process.exit(1);
  }
}

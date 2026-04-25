import { compareSnapshots, formatCompareResult } from './compare';

export function handleCompareCommand(args: string[]): void {
  const jsonFlag = args.includes('--json');
  const filteredArgs = args.filter(a => !a.startsWith('--'));

  if (filteredArgs.length < 2) {
    console.error('Usage: snapenv compare <snapshotA> <snapshotB> [--json]');
    process.exit(1);
  }

  const [nameA, nameB] = filteredArgs;

  let result;
  try {
    result = compareSnapshots(nameA, nameB);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (jsonFlag) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const output = formatCompareResult(result);
  console.log(output);

  const hasChanges =
    Object.keys(result.onlyInA).length > 0 ||
    Object.keys(result.onlyInB).length > 0 ||
    Object.keys(result.changed).length > 0;

  if (!hasChanges) {
    console.log('✔ Snapshots are identical.');
  } else {
    const total =
      Object.keys(result.onlyInA).length +
      Object.keys(result.onlyInB).length +
      Object.keys(result.changed).length;
    console.log(`⚠ ${total} difference(s) found.`);
  }
}

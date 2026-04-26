import { mergeSnapshots, formatMergeResult, ConflictStrategy } from './merge';

export function printMergeHelp(): void {
  console.log(`
snapenv merge <base> <incoming> <output> [--strategy=base|incoming|error]

Merge two snapshots into a new one.

Arguments:
  base       Name of the base snapshot
  incoming   Name of the snapshot to merge in
  output     Name for the resulting merged snapshot

Options:
  --strategy  Conflict resolution: base | incoming (default) | error
  --help      Show this help message
`.trim());
}

export async function handleMergeCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.length === 0) {
    printMergeHelp();
    return;
  }

  const positional = args.filter((a) => !a.startsWith('--'));
  const [baseName, incomingName, outputName] = positional;

  if (!baseName || !incomingName || !outputName) {
    console.error('Error: merge requires <base>, <incoming>, and <output> arguments.');
    printMergeHelp();
    process.exit(1);
  }

  const strategyFlag = args.find((a) => a.startsWith('--strategy='));
  const strategy: ConflictStrategy = strategyFlag
    ? (strategyFlag.split('=')[1] as ConflictStrategy)
    : 'incoming';

  const validStrategies: ConflictStrategy[] = ['base', 'incoming', 'error'];
  if (!validStrategies.includes(strategy)) {
    console.error(`Error: invalid strategy "${strategy}". Use base, incoming, or error.`);
    process.exit(1);
  }

  try {
    const result = await mergeSnapshots(baseName, incomingName, outputName, strategy);
    console.log(`Merged "${baseName}" + "${incomingName}" -> "${outputName}"`);
    console.log(formatMergeResult(result));
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

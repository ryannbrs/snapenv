import { searchSnapshots, formatSearchResults } from './search';

export async function handleSearchCommand(args: string[]): Promise<void> {
  let keyPattern: string | undefined;
  let valuePattern: string | undefined;
  let caseSensitive = false;
  const snapshots: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--key' || arg === '-k') {
      keyPattern = args[++i];
    } else if (arg === '--value' || arg === '-v') {
      valuePattern = args[++i];
    } else if (arg === '--case-sensitive' || arg === '-c') {
      caseSensitive = true;
    } else if (arg === '--snapshot' || arg === '-s') {
      const name = args[++i];
      if (name) snapshots.push(name);
    } else if (arg === '--help' || arg === '-h') {
      printSearchHelp();
      return;
    }
  }

  if (!keyPattern && !valuePattern) {
    console.error('Error: at least one of --key or --value must be specified.');
    printSearchHelp();
    process.exit(1);
  }

  try {
    const results = await searchSnapshots(
      { keyPattern, valuePattern, caseSensitive },
      snapshots.length > 0 ? snapshots : undefined
    );
    console.log(formatSearchResults(results));
  } catch (err) {
    console.error('Search failed:', (err as Error).message);
    process.exit(1);
  }
}

function printSearchHelp(): void {
  console.log(`
Usage: snapenv search [options]

Options:
  -k, --key <pattern>       Search by key (regex or substring)
  -v, --value <pattern>     Search by value (regex or substring)
  -c, --case-sensitive      Enable case-sensitive matching
  -s, --snapshot <name>     Limit search to specific snapshot (repeatable)
  -h, --help                Show this help message

Examples:
  snapenv search --key DATABASE
  snapenv search --value postgres --snapshot prod
  snapenv search --key API --value https --case-sensitive
`.trim());
}

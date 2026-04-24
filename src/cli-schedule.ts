import {
  addSchedule,
  removeSchedule,
  listSchedules,
  ScheduleEntry,
} from './schedule';

function formatEntry(entry: ScheduleEntry): string {
  const label = entry.label ? ` (${entry.label})` : '';
  const lastRun = entry.lastRun ? `  last run: ${entry.lastRun}` : '  never run';
  return `[${entry.id}]${label}\n  cron: ${entry.cronExpression}\n  created: ${entry.createdAt}\n${lastRun}`;
}

export function handleScheduleCommand(args: string[]): void {
  const subcommand = args[0];

  if (!subcommand || subcommand === 'list') {
    const schedules = listSchedules();
    if (schedules.length === 0) {
      console.log('No schedules configured.');
      return;
    }
    console.log(`Schedules (${schedules.length}):`);
    schedules.forEach((s) => console.log('\n' + formatEntry(s)));
    return;
  }

  if (subcommand === 'add') {
    const cron = args[1];
    const label = args[2];
    if (!cron) {
      console.error('Usage: snapenv schedule add <cron-expression> [label]');
      process.exit(1);
    }
    const entry = addSchedule(cron, label);
    console.log(`Schedule added: ${entry.id}`);
    console.log(formatEntry(entry));
    return;
  }

  if (subcommand === 'remove') {
    const id = args[1];
    if (!id) {
      console.error('Usage: snapenv schedule remove <id>');
      process.exit(1);
    }
    const removed = removeSchedule(id);
    if (removed) {
      console.log(`Schedule ${id} removed.`);
    } else {
      console.error(`Schedule not found: ${id}`);
      process.exit(1);
    }
    return;
  }

  console.error(`Unknown schedule subcommand: ${subcommand}`);
  console.error('Available: list, add, remove');
  process.exit(1);
}

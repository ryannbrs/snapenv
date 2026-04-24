import { startWatch, stopWatch, isWatching } from './watch';

export function handleWatchCommand(args: string[]): void {
  const subcommand = args[0];

  switch (subcommand) {
    case 'start': {
      const intervalArg = args.find((a) => a.startsWith('--interval='));
      const labelArg = args.find((a) => a.startsWith('--label='));

      const interval = intervalArg
        ? parseInt(intervalArg.split('=')[1], 10) * 1000
        : 5000;

      const label = labelArg ? labelArg.split('=')[1] : 'watch';

      if (isNaN(interval) || interval <= 0) {
        console.error('Error: --interval must be a positive number (seconds).');
        process.exit(1);
      }

      if (isWatching()) {
        console.error('Error: Watch is already running.');
        process.exit(1);
      }

      console.log(
        `Starting watch with interval ${interval / 1000}s, label "${label}".`
      );
      console.log('Press Ctrl+C to stop.');

      startWatch({
        interval,
        label,
        onChange: (name) => {
          console.log(`[watch] Environment changed — snapshot saved: ${name}`);
        },
      });

      process.on('SIGINT', () => {
        stopWatch();
        console.log('\nWatch stopped.');
        process.exit(0);
      });
      break;
    }

    case 'stop': {
      if (!isWatching()) {
        console.log('No active watch session.');
      } else {
        stopWatch();
        console.log('Watch stopped.');
      }
      break;
    }

    case 'status': {
      console.log(isWatching() ? 'Watch is running.' : 'Watch is not running.');
      break;
    }

    default: {
      console.log('Usage: snapenv watch <start|stop|status> [options]');
      console.log('Options:');
      console.log('  --interval=<seconds>  Poll interval in seconds (default: 5)');
      console.log('  --label=<name>        Snapshot label prefix (default: watch)');
      break;
    }
  }
}

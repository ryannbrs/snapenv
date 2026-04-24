# snapenv

> CLI tool to snapshot, diff, and restore environment variable sets across projects

---

## Installation

```bash
npm install -g snapenv
```

---

## Usage

```bash
# Save a snapshot of your current environment
snapenv save --name production

# List all saved snapshots
snapenv list

# Diff two snapshots
snapenv diff production staging

# Restore a snapshot
snapenv restore production

# Export a snapshot to a .env file
snapenv export production --output .env
```

Snapshots are stored locally in `~/.snapenv/` and can be scoped per project using the `--project` flag:

```bash
snapenv save --name dev --project my-app
snapenv restore dev --project my-app
```

---

## Commands

| Command | Description |
|---|---|
| `save` | Capture current environment variables |
| `list` | List all saved snapshots |
| `diff` | Compare two snapshots |
| `restore` | Apply a snapshot to the current shell |
| `export` | Write a snapshot to a `.env` file |

---

## Requirements

- Node.js >= 16
- npm or yarn

---

## License

[MIT](./LICENSE)

---

> **Note:** `snapenv restore` outputs export statements. Use `eval $(snapenv restore <name>)` to apply them to your current shell session.
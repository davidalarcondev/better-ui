# TUI Command Palette

## What it does

The TUI command palette opens from the prompt with `Ctrl+Shift+S` or by typing `/commands`.

It shows a selectable list of slash commands and short descriptions, so users can discover the available flows without leaving the command center.

## Minimal commands to test

```bash
npx ts-node src/cli.ts /menu
```

Then test:

```text
Press Ctrl+Shift+S
Move with the arrow keys
Press Enter on a command such as /scan or /doctor
Type /commands and confirm that the same palette opens
```

## Notes

- The palette is intentionally non-destructive by itself; it only selects and runs a command.
- `/commands` and `/help` are excluded from the palette list to avoid opening the palette recursively.
- `Esc` exits from the main TUI prompt.
- `Ctrl+C` exits the TUI cleanly without printing readline stack traces.

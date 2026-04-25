# TUI Brush Banner

## What it does

The command center now opens with an oversized ASCII brush banner before the standard `better-ui` heading and workspace panels.

The goal is purely visual: make the tool feel branded the moment someone enters the TUI without changing any workflows or command behavior.

## Minimal commands to test

```bash
npx ts-node src/cli.ts /menu
```

Then confirm the large brush appears above the `better-ui` title.

## Notes

- The banner is rendered from `src/terminalUi.ts` so every entry point that uses `printBanner()` gets the same visual treatment.
- The art uses plain ASCII so it stays stable across common terminal environments, including Windows terminals.
- This is presentation-only and does not affect scans, reports, or slash-command parsing.

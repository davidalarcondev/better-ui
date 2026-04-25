
# Useful Files (what to look for)

This section lists important files and a short note about their responsibilities.

- `src/cli.ts` — CLI entrypoint. Parses arguments and delegates to the workflows and reporters.
- `src/cli/workflows.ts` — High-level orchestrations (scan, fix, doctor, pr-summary, explain). Look here to understand end-to-end flows.
- `src/cli/initCommand.ts` — Interactive project bootstrap and preset handling.
- `src/presets.ts` — Preset definitions used by `init` (React, Next, Vite, etc.).
- `src/tui/app.ts` — Terminal UI (Enquirer) implementation: dashboard, command palette, review flows.
- `src/explanations.ts` — Maps raw issues to human-friendly why/fix/risk guidance.
- `src/scanners/eslintScanner.ts` — Primary source of lint/type issues and autofix previews. Also implements hunk extraction and apply logic.
- `src/scanners/imageScanner.ts` — Discovers images and performs optional WebP generation.
- `src/insights.ts` — Scoring, category aggregation, hotspots, and markdown builders for reviews.
- `src/reporters/htmlReporter.ts` — Generates visual HTML reports for sharing or CI artifacts.
- `src/reporters/jsonReporter.ts` — Writes JSON reports and is the preferred machine-readable output.
- `src/reporters/terminalReporter.ts` — Compact terminal summary used by interactive flows.
- `src/history.ts` — Snapshot persistence (writes to `.better-ui/history/latest.json`).
- `src/slashCommands.ts` — Slash command parsing and alias support (makes `/scan` style invocation usable).
- `src/projectPaths.ts` — Path safety helpers (resolveProjectPath, toProjectRelativePath). All writes must use these helpers.

If you are trying to implement or change behavior, start by reading `src/cli/workflows.ts` and the relevant scanner or reporter.

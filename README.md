# better-ui

`better-ui` is a local frontend command center for scanning projects, scoring health, reviewing changed files, spotting hotspots, and optimizing images from the terminal.

It supports direct slash commands such as `better-ui /scan`, `better-ui /health`, and `better-ui /menu`, plus a richer TUI designed around a dashboard-and-command-palette workflow.

All repository documentation is in English. The detailed sections referenced from this README were split into the `docs/` directory. See `AGENTS.md` for the quick index and read `instructions.md` in the project root before adding new features or docs.
## What it does now

- Scans `js`, `jsx`, `ts`, and `tsx` files with ESLint plus TypeScript diagnostics.
- Adds frontend-specific heuristics for accessibility and maintainability.
- Scores the project health from `0` to `100`.
- Tracks issue categories: correctness, maintainability, accessibility, performance, DX, and code quality.
- Saves scan snapshots to `.better-ui/history` for later comparisons.
- Reviews only changed or staged files for pre-commit / PR workflows.
- Adds a doctor view for config and script readiness.
- Can explain findings in human terms, including why they matter and safer fixes.
- Supports HTML reports for a more shareable visual summary.
- Supports setup presets for React, Next.js, Vite, Vue, design systems, landing pages, and TypeScript libraries.
- Shows hotspots so you can fix the highest-risk files first.
- Scans images and can generate `.webp` variants.
- Exposes every major flow through both CLI commands and slash commands.

## Main workflows

1. Open the command center

   `npx ts-node src/cli.ts /menu`

2. Run a full scan

   `npx ts-node src/cli.ts /scan`

3. Review current work before commit

   `npx ts-node src/cli.ts /review --changed`

   `npx ts-node src/cli.ts /review --staged`

4. Check health score

   `npx ts-node src/cli.ts /health`

5. Compare against the last snapshot

   `npx ts-node src/cli.ts /compare`

6. Run the full doctor check

   `npx ts-node src/cli.ts /doctor`

7. Explain findings for a file or report

   `npx ts-node src/cli.ts /explain src/components/App.tsx`

8. Generate a visual HTML report

   `npx ts-node src/cli.ts /scan --format html --out report.html`

9. Bootstrap using a preset

   `npx ts-node src/cli.ts /init --preset next`

## Command catalog

The CLI is slash-only. Use commands such as:

- `better-ui /scan`
- `better-ui /fix`
- `better-ui /health`
- `better-ui /doctor`
- `better-ui /hotspots`
- `better-ui /a11y`
- `better-ui /review`
- `better-ui /pr-summary`
- `better-ui /compare`
- `better-ui /explain`
- `better-ui /images`
- `better-ui /init`
- `better-ui /menu`
- `better-ui /commands`

## Slash commands

- `/scan`
- `/changed`
- `/staged`
- `/fix`
- `/fix-preview`
- `/fix-apply`
- `/health`
- `/doctor`
- `/hotspots`
- `/a11y`
- `/review`
- `/review-changed`
- `/review-staged`
- `/pr-summary`
- `/compare`
- `/explain`
- `/images`
- `/init`
- `/menu`
- `/commands`
- `/help`

Inside the TUI, `/exit` is available to leave the command center directly.

Examples:

```bash
better-ui /scan --changed
better-ui /scan --format html --out report.html
better-ui /fix --interactive
better-ui /fix --apply
better-ui /doctor
better-ui /a11y --changed
better-ui /review --staged --out review.md
better-ui /pr-summary --out pr-summary.md
better-ui /explain report.json
better-ui /images --generate
better-ui /menu
```

## Reports and scoring

`scan` writes a JSON report by default and also stores a snapshot under `.better-ui/history/latest.json` for compare workflows.

Each report includes:

- errors
- warnings
- total issues
- files with issues
- health score
- category counts
- file-level messages

Supported formats:

- `json`
- `markdown`
- `html`

Examples:

```bash
better-ui /scan --format json --out report.json
better-ui /scan --format markdown --out report.md
better-ui /scan --format html --out report.html
```

`health` adds:

- category scores
- safe autofix count
- high-impact issue count
- image payload summary
- top priorities
- hotspots

`doctor` adds:

- config completeness
- missing helper scripts
- project readiness hints

`explain` adds:

- why the issue matters
- how to fix it safely
- estimated risk
- whether it is safe to autofix

## Git-aware workflows

When the current directory is a git repository, `better-ui` can scope work to the current diff.

- `/changed` scans modified, staged, and untracked files.
- `/staged` scans only staged files.
- `/review --changed` creates a PR-style summary for current work.
- `/review --staged` helps you review what is about to be committed.
- `/pr-summary` defaults to changed files and is ready to paste into a pull request.
- `/fix --interactive` can now select individual diff blocks, not only whole files.

## TUI

`better-ui /menu` opens the interactive command center.

When the TUI starts, it renders an oversized branded banner before the workspace panels.
The command center is now prompt-first: you type slash commands directly, and `Ctrl+Shift+S` opens a selectable command palette.

The TUI includes:

- workspace dashboard
- health screen
- doctor screen
- accessibility-only audit view
- changed/staged review flows
- explain view for issues
- fix preview / apply actions
- interactive fix selection by diff block
- image conversion flow
- command palette opened with `Ctrl+Shift+S` or `/commands`
- slash-command prompt with direct command entry
- dedicated exit hint (`Esc`) in the footer

Every primary action exposed in the TUI has a slash-command equivalent. The TUI command palette lets you browse and select commands without leaving the prompt flow.

## Configuration

`better-ui /init` creates `better-ui.config.json`.

You can also start with presets:

- `react`
- `next`
- `vite`
- `vue`
- `design-system`
- `landing-page`
- `typescript-library`

Example:

```bash
better-ui /init --preset next
```

Example:

```json
{
  "projectName": "my-project",
  "preset": "next",
  "defaults": {
    "reportFile": "next-report.html",
    "extensions": [".js", ".jsx", ".ts", ".tsx"]
  },
  "scripts": {
    "scan": "better-ui /scan --format html --out next-report.html",
    "fix": "better-ui /fix --interactive"
  }
}
```

## Security and guardrails

- Local-only tool. No outbound network behavior in product code.
- Report, review, image, and history outputs stay inside the project root.
- File traversal skips `node_modules`, `dist`, `.git`, and symlinks.
- Fix mode is dry-run by default.
- `fix --interactive` writes only the selected diff blocks after confirmation.
- The CLI rejects non-slash top-level commands to keep execution paths explicit.
- The TUI exits cleanly on `Esc` and `Ctrl+C` without printing readline stack traces.
- The local binary falls back to `ts-node` only when the compiled entrypoint is missing.

## Development commands

```bash
npm install
npm run lint
npm run typecheck
npm run build
npx ts-node src/cli.ts /commands
node bin/better-ui.js /help
```

## Current limitations

- No automated tests yet.
- The UI heuristics are intentionally simple and best-effort, not a full AST-based accessibility engine.
- `fix --apply` only writes what ESLint can autofix.
- `fix --interactive` is line-diff based and not yet a full git-style patch engine.
- There is no browser-based UI; the product is terminal-first.

## Important files

- `src/cli.ts`: CLI entrypoint and command surface.
- `src/tui/app.ts`: interactive command center.
- `src/cli/workflows.ts`: shared scan/fix/health/review workflows.
- `src/explanations.ts`: human-readable issue explanations and guidance.
- `src/presets.ts`: setup presets used by `init`.
- `src/scanners/eslintScanner.ts`: ESLint, TypeScript, and frontend heuristics.
- `src/scanners/imageScanner.ts`: image discovery and WebP generation.
- `src/insights.ts`: scoring, hotspots, markdown summaries, comparisons.
- `src/history.ts`: snapshot persistence.
- `src/slashCommands.ts`: slash command parsing and aliases.
- `src/reporters/htmlReporter.ts`: visual HTML report generation.

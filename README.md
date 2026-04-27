# better-ui

![better-ui header](assets/better-ui.png)

`better-ui` is an open source local frontend command center for scanning projects, scoring health, reviewing changed files, spotting hotspots, and optimizing images from the terminal.

The repository and product name are `better-ui`. The published npm package and executable are `better-ui-cli`.

It supports direct slash commands such as `better-ui-cli /scan`, `better-ui-cli /health`, and `better-ui-cli /menu`, plus a richer TUI designed around a dashboard-and-command-palette workflow.

All repository documentation is in English. The detailed sections referenced from this README were split into the `docs/` directory. See `AGENTS.md` for the quick index and read `instructions.md` in the project root before adding new features or docs.

## Open source project

- Contribution guide: `CONTRIBUTING.md`
- Repository instructions: `instructions.md`
- Open source roadmap: `docs/open-source-roadmap.md`
- Distribution and installation: `docs/distribution-and-installation.md`
- Testing and CI: `docs/testing-and-ci.md`
- Security notes: `docs/security-notes.md`

The goal is to make `better-ui` broadly useful for frontend developers while staying honest about current limits and keeping the core tool local-first and reviewable.
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

### Install and run in any project

Install globally if you want the command available everywhere:

```bash
npm install -g better-ui-cli
better-ui-cli /menu
```

Or run it on demand without a global install:

```bash
npx better-ui-cli
npx better-ui-cli /menu
npx better-ui-cli /scan
npm exec better-ui-cli -- /health
pnpm dlx better-ui-cli /review --changed
```

Behavior rules:

- `better-ui-cli` with no arguments opens the command center.
- Any explicit action beyond opening the menu must still use slash commands such as `/scan`, `/health`, or `/review --changed`.
- Non-slash top-level commands remain rejected on purpose.

During repository development, you can still run the source entrypoint directly:

```bash
npx ts-node src/cli.ts
npx ts-node src/cli.ts /menu
```

That source form is only for working inside the `better-ui` repository itself.

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

- `better-ui-cli`
- `better-ui-cli /scan`
- `better-ui-cli /fix`
- `better-ui-cli /health`
- `better-ui-cli /doctor`
- `better-ui-cli /hotspots`
- `better-ui-cli /a11y`
- `better-ui-cli /review`
- `better-ui-cli /pr-summary`
- `better-ui-cli /compare`
- `better-ui-cli /explain`
- `better-ui-cli /images`
- `better-ui-cli /init`
- `better-ui-cli /menu`
- `better-ui-cli /commands`

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
better-ui-cli /scan --changed
better-ui-cli /scan --format html --out report.html
better-ui-cli /fix --interactive
better-ui-cli /fix --apply
better-ui-cli /doctor
better-ui-cli /a11y --changed
better-ui-cli /review --staged --out review.md
better-ui-cli /pr-summary --out pr-summary.md
better-ui-cli /explain report.json
better-ui-cli /images --generate
better-ui-cli
better-ui-cli /menu
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
better-ui-cli /scan --format json --out report.json
better-ui-cli /scan --format markdown --out report.md
better-ui-cli /scan --format html --out report.html
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

When the current directory is a git repository, `better-ui-cli` can scope work to the current diff.

- `/changed` scans modified, staged, and untracked files.
- `/staged` scans only staged files.
- `/review --changed` creates a PR-style summary for current work.
- `/review --staged` helps you review what is about to be committed.
- `/pr-summary` defaults to changed files and is ready to paste into a pull request.
- `/fix --interactive` can now select individual diff blocks, not only whole files.

## TUI

`better-ui-cli /menu` opens the interactive command center.

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

`better-ui-cli /init` creates `better-ui.config.json`.

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
better-ui-cli /init --preset next
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
    "scan": "better-ui-cli /scan --format html --out next-report.html",
    "fix": "better-ui-cli /fix --interactive"
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
npm run verify
npm run pack:dry-run
npm run lint
npm run typecheck
npm run build
npx ts-node src/cli.ts /commands
node bin/better-ui.js /help
```

## Release automation and CI

See `docs/release-automation.md` for details on how the release workflow works, required tokens, and troubleshooting steps if a release does not run after a merge. The repository uses `googleapis/release-please-action@v4` and listens to pushes on both `main` and `master`.


## Current limitations

- Automated tests exist, but coverage is still narrow compared with the full CLI and TUI surface.
- The UI heuristics are intentionally simple and best-effort, not a full AST-based accessibility engine.
- `fix --apply` only writes what ESLint can autofix.
- `fix --interactive` is line-diff based and not yet a full git-style patch engine.
- There is no browser-based UI; the product is terminal-first.
- The current insights and explanation engines are useful but still lightweight compared with mature enterprise analyzers.

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

# Repository Instructions

This file defines the baseline contribution workflow for `better-ui`.

## Contribution sequence

1. Read `instructions.md`, `AGENTS.md`, and the relevant files in `docs/`.
2. Make the smallest correct change that solves the problem.
3. Run local verification before proposing the change.
4. Update documentation whenever behavior, workflows, or contributor expectations change.

## Required local verification

Run these commands from the repository root:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

When relevant, also exercise the affected CLI flow directly:

```bash
npx ts-node src/cli.ts /commands
npx ts-node src/cli.ts /scan --format json --out tmp-report.json
```

## Documentation rules

- Functional changes must update `README.md`.
- Changes that add or reshape behavior must add or update a focused file under `docs/`.
- Contributor-process changes must update `CONTRIBUTING.md` or this file.

## Product guardrails

- Keep the product local-first.
- Do not add outbound network behavior in product code without explicit review.
- Keep writes inside the project root using `src/projectPaths.ts`.
- Prefer dry-run or preview behavior before destructive or write-heavy flows.

## Open source bar

Changes should improve at least one of these:

- correctness
- maintainability
- contributor onboarding
- release confidence
- user trust in CLI output

## Change summary expectations

Any final change summary should include:

- what changed
- which docs were read and why
- which verification commands ran
- any known gaps or limitations

# Distribution and Installation

## Goal

Make `better-ui` usable from any frontend project without cloning the repository or invoking internal source paths.

## Recommended usage once published

Open the command center in the current project:

```bash
npx better-ui
```

Other equivalent forms:

```bash
npm exec better-ui
pnpm dlx better-ui
```

This opens the same command center as `/menu`.

Run a scan in the current project:

```bash
npx better-ui /scan
```

## Local development package flow

From the `better-ui` repository:

```bash
npm install
npm run verify
npm link
```

Then from any other project on the same machine:

```bash
better-ui /menu
better-ui /scan
better-ui /health
```

The supported UX is:

- `better-ui` opens the TUI menu.
- `better-ui /scan` and similar slash commands run direct actions.
- non-slash top-level commands stay invalid by design.

## Packaging behavior

- The package exposes a `better-ui` binary through `bin/better-ui.js`.
- The binary loads the compiled CLI from `dist/src/cli.js`.
- In local development, the binary falls back to `ts-node` only when the compiled output is missing.
- The package ships only the files needed to run the CLI (`bin`, `dist`, and core top-level docs).

## Publish verification

Before publishing, run:

```bash
npm run verify
npm run pack:dry-run
```

`prepack` builds the distributable package and `prepublishOnly` enforces verification before publication.

## Notes

- `npm better-ui` is not a valid npm execution form. The supported commands are `better-ui`, `npx better-ui`, `npm exec better-ui`, and `pnpm dlx better-ui`.
- `npx ts-node src/cli.ts /menu` is a repository-development command only. It works inside the `better-ui` repository, not inside arbitrary target projects.
- For normal users, the supported entrypoint is the package binary (`better-ui`).

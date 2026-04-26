
# Reliable Dev Commands

This file lists the most useful commands for working on the project locally and what to expect when you run them.

Core commands:

- Install dependencies: `npm install`
- Typecheck (quick check, no emit): `npx tsc --noEmit`
- Lint repository: `npx eslint .`
- Run the automated test suite: `npm run test:ci`
- Build distributable CLI: `npm run build` (produces `dist/` and updates `bin/better-ui.js`)
- Run commands in development directly with ts-node: `npx ts-node src/cli.ts <command>`
- Slash CLI entrypoint (equivalent): `npx ts-node src/cli.ts /scan`
- Packaged/local binary (when built): `node bin/better-ui.js --help`

Notes and verification:

- If `npx tsc --noEmit` reports errors, fix type issues before making significant changes.
- `npx eslint .` should be run before committing; follow autofix suggestions where safe.
- When `bin/better-ui.js` delegates to `ts-node`, it is because the compiled dist is missing — this is expected during active development.

For automated agents:

- When running tests or behavior checks in CI, replicate these commands in the same order: install → typecheck → lint → test → build (if validating packaging).
- Always ensure any write actions performed by automation obey the path-safety helpers in `src/projectPaths.ts`.


# Testing and CI

This file describes the current verification bar for `better-ui` and the commands contributors should run before opening a pull request or publishing a release.

## Local verification

Run these commands from the repository root:

```bash
npm install
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

If you are validating packaging or a release candidate, also run:

```bash
npm run pack:dry-run
node ./bin/better-ui.js /commands
```

## What each check covers

- `npm run typecheck` verifies the TypeScript codebase without emitting build output.
- `npm run lint` checks repository code against the current flat ESLint configuration.
- `npm run test:ci` runs the non-watch Vitest suite.
- `npm run build` compiles the distributable CLI into `dist/`.
- `npm run pack:dry-run` verifies what would be published to npm.
- `node ./bin/better-ui.js /commands` is the quickest smoke test for the packaged entrypoint.

## CI expectations

CI should enforce the same baseline as local verification:

1. install dependencies
2. typecheck
3. lint
4. test
5. build
6. validate packaging when release confidence matters

This keeps contributor workflows and release workflows aligned.

## When to run extra checks

- If you changed slash-command parsing or the command catalog, run `npm run test:ci` and smoke-test `/commands`.
- If you changed packaging, docs for installation, or binary behavior, run `npm run pack:dry-run` and `node ./bin/better-ui.js /commands`.
- If you changed scanners or reporters, run a real scan such as `npx ts-node src/cli.ts /scan --format json --out tmp-report.json`.

## Notes

- The repository name is `better-ui`.
- The published npm package and executable are `better-ui-cli`.
- Prefer documenting verification exactly as it was run so contributors can reproduce failures.


# Config Behavior & Schema

`better-ui` stores lightweight project preferences in `better-ui.config.json`. The config is advisory and used to provide defaults for commands and reports.

Typical fields:

```json
{
  "projectName": "my-project",
  "preset": "next",
  "defaults": {
    "reportFile": "better-ui-report.html",
    "extensions": [".js", ".jsx", ".ts", ".tsx"]
  },
  "scripts": {
    "scan": "better-ui /scan --format html --out better-ui-report.html",
    "fix": "better-ui /fix --interactive"
  }
}
```

Key behaviors:

- `better-ui init` will create `better-ui.config.json` and may inject informational `better-ui:*` scripts into the target project's `package.json`.
- Commands read `better-ui.config.json` for defaults such as `projectName`, `preset`, `defaults.reportFile`, and `defaults.extensions`.
- Scripts written to `package.json` are informational only; the CLI does not execute or modify those script strings dynamically.

Path safety:

- All reporters and write operations must use `src/projectPaths.ts` helpers (e.g., `resolveProjectPath`, `toProjectRelativePath`) to ensure writes stay inside the project root. Do not write outside the project root.

For automation and agents:

- When an automated agent modifies `better-ui.config.json`, it should include an accompanying docs file under `docs/` and update `AGENTS.md` linking to the new doc per repository policy (`better-ui/instructions.md`).


# Scanner Details & Limitations

What the scanner does:

- Primary engine: programmatic ESLint with `@typescript-eslint` for parsing TypeScript and JSX.
- Additional checks: TypeScript pre-emit diagnostics are included for `.ts` and `.tsx` files (via the TypeScript compiler API).
- Normalization: messages are normalized, deduplicated, and sorted before reporting to make downstream tooling deterministic.

Default scope and exclusions:

- Default extensions: `.js`, `.jsx`, `.ts`, `.tsx` (configurable via `better-ui.config.json`).
- The scanner respects project ignore configurations and skips `node_modules`, `.git`, and symlinks.

Failure modes and fallbacks:

- If ESLint fails to analyze a file (parser errors, plugin load issues), the scanner falls back to simple regex heuristics that can approximate common issues such as `no-console`, `eqeqeq`, and obvious unused variables.
- Fallback items are best-effort: they may not include accurate `line`/`column` information (these fields may be null).

Data shape (example for a finding):

{
  "file": "src/components/App.tsx",
  "ruleId": "no-console",
  "message": "Unexpected console statement.",
  "severity": "warning",
  "line": 42,
  "column": 5,
  "category": "correctness"
}

Limitations to be aware of:

- Heuristics are not a substitute for semantic AST-based analysis for accessibility or complex code patterns.
- The hunk-based interactive fixer uses a line-diff LCS algorithm. It is robust for normal edits but not a full git-style patch engine. Confirm behavior before applying to large or critical files.
- The scanner is intentionally local-only and does not attempt to reach external services for additional analysis.

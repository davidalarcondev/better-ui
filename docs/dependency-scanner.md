# Dependency Scanner

The dependency scanner is a new core feature in `better-ui` 1.0 designed to keep your frontend bundles lean.

## What it does

When you run `/deps`, the tool scans your `package.json` dependencies and deeply checks your `src/` directory for actual usage. It reports on:

1. **Dead Code (Unused Dependencies):** Packages listed in your `dependencies` that are never imported via `import`, `require()`, or dynamic `import()`. This allows you to quickly prune packages you experimented with but forgot to uninstall.
2. **Heavy Dependencies:** Packages known to bloat frontend bundles (like `lodash`, `moment`, `three`, `echarts`) that are installed in your project, acting as an early warning system to switch to lighter alternatives (e.g., `date-fns`, `lodash-es`). This is a curated heuristic, not a real bundle-size measurement.

## How to use it

From the terminal:
```bash
npx ts-node src/cli.ts /deps
```

From inside the TUI:
```bash
/deps
```

## Considerations and Limitations

- **Fast Heuristic:** To maintain the extreme speed of the tool, the dependency scan uses regular expressions against your source files rather than a full AST parse. While highly accurate for standard `import` and `require` statements, extremely obfuscated dynamic imports might be missed.
- **Scope:** It primarily checks `src/`. If you only import a dependency in a config file located at the root (like `vite.config.ts`), it might be flagged as unused.
- **Type Definitions:** It automatically ignores `@types/*` packages and build tools like `typescript` and `eslint` to avoid false positives.

## Verification
To verify this works locally:
1. Run `npx ts-node src/cli.ts /deps` and observe the output.
2. Temporarily add `"moment": "^2.29.4"` to your `package.json` without importing it, run `/deps` again, and see it flagged as both Unused and Heavy.

import { ESLint } from "eslint";
import path from "path";
import fs from "fs";
import { FileReport } from "../types";

export async function scanProject(projectRoot: string, exts?: string[]): Promise<FileReport[]> {
  // Default to .js to avoid requiring TypeScript parser in this minimal scaffold.
  const extensions = exts && exts.length > 0 ? exts : [".js"];

  // Build glob pattern from extensions
  const pattern = `**/*.{${extensions.map(e => e.replace(/^\./, "")).join(",")}}`;

  // Use a minimal base config so the scanner works even without a local .eslintrc
  // Use a minimal base config and disable loading local config files so the scanner
  // runs predictably even in projects without an .eslintrc.
  // Build a minimal options object and cast to any to avoid runtime/type mismatches
  // across different ESLint versions in this scaffolded environment.
  const eslintOptions: any = {
    cwd: projectRoot,
    // Provide some example rules so the scaffold shows real findings by default.
    overrideConfig: {
      parserOptions: { ecmaVersion: 2020, sourceType: "module" },
      env: { node: true, es2020: true },
      rules: {
        // warn about unused variables
        "no-unused-vars": ["warn", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false }],
        // discourage console.* usage (common in production code)
        "no-console": "warn",
        // require === instead of ==
        "eqeqeq": "error"
      }
    },
    ignore: false
  };

  const eslint = new ESLint(eslintOptions);

  // Walk the project directory and collect files matching the extensions
  const walk = async (dir: string, collected: string[] = []) => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === "dist") continue;
        await walk(full, collected);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (extensions.includes(ext)) collected.push(full);
      }
    }
    return collected;
  };

  const files = await walk(projectRoot, []);
  const results = [] as any[];
  for (const f of files) {
    let code = "";
    try {
      code = await fs.promises.readFile(f, "utf8");
      // Lint the file content. Avoid passing filePath to prevent ESLint
      // attempting to load external configs based on the filename in
      // this minimal scaffold environment.
      const r = await eslint.lintText(code);
      // Ensure reported filePath is the real file for clearer reports
      for (const item of r) {
        if (!item.filePath || item.filePath === "<text>") item.filePath = f;
      }
      // eslint.lintText returns an array of results for the text; concat
      results.push(...r);
    } catch (err) {
      // If ESLint failed (often due to missing config in this scaffold),
      // fall back to a few simple heuristic checks so the scanner still
      // produces useful output for learning purposes.
      console.warn(`Warning: failed to lint ${f}: ${err}`);
      const fallbackMessages: any[] = [];
      // detect console usage
      if (/console\./.test(code)) {
        fallbackMessages.push({ ruleId: "no-console", message: "Use of console detected", line: null, column: null, severity: 1 });
      }
      // detect loose equality == (but not ===)
      if (/(^|[^=])==([^=]|$)/.test(code)) {
        fallbackMessages.push({ ruleId: "eqeqeq", message: "Use '===' instead of '=='", line: null, column: null, severity: 2 });
      }
      // detect simple unused var/let/const (heuristic)
      const decls = [] as string[];
      const declRe = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)/g;
      let m;
      while ((m = declRe.exec(code))) {
        decls.push(m[1]);
      }
      for (const name of decls) {
        // check if name appears elsewhere beyond the declaration
        const usageRe = new RegExp("\\b" + name + "\\b", "g");
        const matches = [...code.matchAll(usageRe)];
        if (matches.length <= 1) {
          fallbackMessages.push({ ruleId: "no-unused-vars", message: `\'${name}\' is defined but never used`, line: null, column: null, severity: 1 });
        }
      }

      if (fallbackMessages.length > 0) {
        results.push({ filePath: f, errorCount: fallbackMessages.filter(x => x.severity === 2).length, warningCount: fallbackMessages.filter(x => x.severity === 1).length, messages: fallbackMessages });
      }
    }
  }

  const reports: FileReport[] = results.map(r => ({
    filePath: path.relative(projectRoot, r.filePath),
    errorCount: r.errorCount,
    warningCount: r.warningCount,
    messages: r.messages.map((m: any) => ({
      ruleId: m.ruleId,
      message: m.message,
      line: m.line ?? null,
      column: m.column ?? null,
      severity: m.severity
    }))
  }));

  return reports;
}

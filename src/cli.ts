import { Command } from "commander";
import path from "path";
import { scanProject } from "./scanners/eslintScanner";
import { writeJsonReport } from "./reporters/jsonReporter";

const program = new Command();

program
  .name("better-ui")
  .description("Project Doctor - scan and report frontend issues")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan the current project with ESLint and produce a JSON report")
  .option("--out <file>", "report file", "report.json")
  .option("--ext <exts>", "comma-separated extensions (eg. .js,.ts)")
  .action(async (opts: { out: string; ext?: string }) => {
    try {
      const projectRoot = process.cwd();
      const exts = opts.ext ? opts.ext.split(",").map(s => s.trim()) : undefined;
      console.log(`Scanning project at ${projectRoot} ...`);
      const files = await scanProject(projectRoot, exts);
      writeJsonReport(opts.out, files);
      const errors = files.reduce((s, f) => s + f.errorCount, 0);
      const warnings = files.reduce((s, f) => s + f.warningCount, 0);
      console.log(`Scan complete. Errors: ${errors}, Warnings: ${warnings}`);
      console.log(`Report written to ${path.resolve(opts.out)}`);
    } catch (err) {
      console.error("Scan failed:", err);
      process.exitCode = 2;
    }
  });

// If invoked without subcommand, show help
if (process.argv.length <= 2) {
  program.help();
} else {
  program.parse(process.argv);
}

import { Command } from "commander";
import path from "path";
import chalk from "chalk";
import { prompt } from "enquirer";
import { COMMANDS } from "./commandCatalog";
import { runInit } from "./cli/initCommand";
import {
  applyInteractiveHunkSelection,
  runAccessibilityWorkflow,
  runCompareWorkflow,
  runDoctorWorkflow,
  runExplainWorkflow,
  runFixWorkflow,
  runHealthWorkflow,
  runInteractiveFixWorkflow,
  runPrSummaryWorkflow,
  runReviewWorkflow,
  runScanWorkflow
} from "./cli/workflows";
import { explainMessage } from "./explanations";
import { loadLatestSnapshot } from "./history";
import { buildHotspots } from "./insights";
import { printSummary } from "./reporters/terminalReporter";
import { scanImages, generateWebP } from "./scanners/imageScanner";
import { normalizeSlashArgv } from "./slashCommands";
import { printBanner, printCommandCatalog, printPanel, formatDelta } from "./terminalUi";
import { runTui } from "./tui/app";

function parseExtensions(value?: string) {
  return value ? value.split(",").map(segment => segment.trim()).filter(Boolean) : undefined;
}

function addScopeOptions(command: Command) {
  return command
    .option("--changed", "Limit the command to modified and untracked git files")
    .option("--staged", "Limit the command to staged git files");
}

const program = new Command();

program
  .name("better-ui")
  .description("Frontend command center for scans, health insights, reviews, and image optimization")
  .version("0.2.0")
  .showHelpAfterError();

addScopeOptions(
  program
    .command("scan")
    .description("Scan the project and produce a report with scoring, categories, and history")
    .option("--out <file>", "Report file")
    .option("--ext <exts>", "Comma-separated extensions (eg. .js,.ts)")
    .option("--format <format>", "json, markdown, or html", "json")
    .action(async (opts: { out?: string; ext?: string; changed?: boolean; staged?: boolean; format?: "json" | "markdown" | "html" }) => {
      try {
        const projectRoot = process.cwd();
        const result = await runScanWorkflow(projectRoot, {
          out: opts.out,
          ext: parseExtensions(opts.ext),
          changed: opts.changed,
          staged: opts.staged,
          format: opts.format
        });

        printBanner();
        printSummary(result.report);
        printPanel("Scan Output", [
          `${chalk.cyan("Scope:")} ${result.report.scope || "all"}`,
          `${chalk.cyan("Saved report:")} ${path.resolve(result.reportPath)}`,
          `${chalk.cyan("History snapshot:")} ${result.snapshotPath ? path.resolve(result.snapshotPath) : "disabled"}`
        ], "cyan");
      } catch (err) {
        console.error("Scan failed:", err);
        process.exitCode = 2;
      }
    })
);

addScopeOptions(
  program
    .command("fix")
    .description("Preview or apply ESLint autofixes, optionally only on changed or staged files")
    .option("--apply", "Actually write fixes to disk")
    .option("--interactive", "Preview fixable files and choose which ones to update")
    .action(async (opts: { apply?: boolean; interactive?: boolean; changed?: boolean; staged?: boolean }) => {
      try {
        const projectRoot = process.cwd();

        if (opts.interactive) {
          const interactive = await runInteractiveFixWorkflow(projectRoot, opts);
           printBanner();

          if (interactive.previews.length === 0) {
            printPanel("Interactive Fix", ["No ESLint autofixes are currently available for the selected scope."], "green");
            return;
          }

          printPanel("Interactive Fix Preview", [
            `${chalk.cyan("Scope:")} ${interactive.scope}`,
            `${chalk.cyan("Files with autofixes:")} ${interactive.previews.length}`,
            ...interactive.previews.slice(0, 4).map(preview => `${preview.filePath} (${preview.changedLines} changed lines)`)
          ], "yellow");

          const selection: any = await prompt({
            type: "multiselect",
            name: "hunks",
            message: "Select diff blocks to apply",
            choices: interactive.previews.flatMap(preview => preview.hunks.map(hunk => ({
              name: hunk.id,
              message: `${hunk.label} | ${hunk.preview.slice(0, 2).join(" ")}`
            })))
          } as any);

          const selectedHunks = (selection.hunks || []) as string[];
          if (selectedHunks.length === 0) {
            printPanel("Interactive Fix", ["No files were selected."], "yellow");
            return;
          }

          const selectedPreviewLines = interactive.previews.flatMap(preview => preview.hunks.filter(hunk => selectedHunks.includes(hunk.id)).flatMap(hunk => [
            `${chalk.cyan(hunk.label)}`,
            ...hunk.preview.slice(0, 6)
          ]));
          printPanel("Selected Diff Preview", selectedPreviewLines.slice(0, 24), "cyan");

          const confirmation: any = await prompt({
            type: "confirm",
            name: "approved",
            message: `Apply ${selectedHunks.length} selected diff blocks?`,
            initial: false
          } as any);

          if (!confirmation.approved) {
            printPanel("Interactive Fix", ["Cancelled before writing changes."], "yellow");
            return;
          }

          const report = await applyInteractiveHunkSelection(projectRoot, interactive.previews, selectedHunks, opts);
          const touchedFiles = [...new Set(interactive.previews.filter(preview => preview.hunks.some(hunk => selectedHunks.includes(hunk.id))).map(preview => preview.filePath))];
          printPanel("Interactive Fix Applied", [
            `${chalk.cyan("Files updated:")} ${touchedFiles.length}`,
            `${chalk.cyan("Blocks applied:")} ${selectedHunks.length}`,
            `${chalk.cyan("Remaining errors:")} ${report.summary.errors}`,
            `${chalk.cyan("Remaining warnings:")} ${report.summary.warnings}`
          ], "green");
          return;
        }

        const result = await runFixWorkflow(projectRoot, opts);
        printBanner();

        if (result.preview) {
          printPanel("Fix Preview", [
            `${chalk.cyan("Scope:")} ${result.report.scope || "all"}`,
            `${chalk.cyan("Errors:")} ${String(result.report.summary.errors)}`,
            `${chalk.cyan("Warnings:")} ${String(result.report.summary.warnings)}`,
            chalk.dim("Re-run with --apply to write autofixes.")
          ], "yellow");
          return;
        }

        printPanel("Fix Completed", [
          `${chalk.cyan("Remaining errors:")} ${String(result.report.summary.errors)}`,
          `${chalk.cyan("Remaining warnings:")} ${String(result.report.summary.warnings)}`,
          chalk.dim("Review the updated files before committing.")
        ], "green");
      } catch (err) {
        console.error("Fix failed:", err);
        process.exitCode = 2;
      }
    })
);

program
  .command("doctor")
  .description("Run a broad project doctor view with health, config, and script checks")
  .action(async () => {
    try {
      const result = await runDoctorWorkflow(process.cwd());
      printBanner();
      printPanel("Doctor Overview", [
        `${chalk.cyan("Score:")} ${result.health.score}/100`,
        `${chalk.cyan("Config completeness:")} ${result.doctor.configCompleteness}`,
        `${chalk.cyan("Scripts present:")} ${result.doctor.scriptsPresent}/${result.doctor.scriptChecks}`,
        `${chalk.cyan("High impact issues:")} ${result.health.summary.highImpactIssues}`,
        `${chalk.cyan("Image payload:")} ${Math.round(result.health.summary.imageBytes / 1024)} KB`
      ], "magenta");
      printPanel("Doctor Findings", [
        result.doctor.missingConfig.length > 0 ? `Missing config fields: ${result.doctor.missingConfig.join(", ")}` : "Config file looks complete.",
        result.doctor.missingScripts.length > 0 ? `Missing helper scripts: ${result.doctor.missingScripts.join(", ")}` : "Helper scripts are present.",
        ...result.health.priorities.map(priority => `${priority.label} - ${priority.detail}`)
      ], "yellow");
    } catch (err) {
      console.error("Doctor command failed:", err);
      process.exitCode = 2;
    }
  });

program
  .command("health")
  .description("Show a frontend health score with categories, priorities, and image weight")
  .action(async () => {
    try {
      const result = await runHealthWorkflow(process.cwd());
       printBanner();
      printPanel("Project Health", [
        `${chalk.cyan("Score:")} ${chalk.bold(String(result.health.score) + "/100")}`,
        `${chalk.cyan("Errors / warnings:")} ${result.health.summary.errors} / ${result.health.summary.warnings}`,
        `${chalk.cyan("Files with issues:")} ${String(result.health.summary.filesWithIssues)}`,
        `${chalk.cyan("Safe autofixes:")} ${String(result.health.summary.safeAutofixes)}`,
        `${chalk.cyan("Images:")} ${result.health.summary.images} files, ${Math.round(result.health.summary.imageBytes / 1024)} KB`
      ], "magenta");

      printPanel("Category Scores", Object.values(result.health.categories).map(category => `${chalk.cyan(category.label + ":")} ${category.score}/100 (${category.count} issues)`), "blue");
      printPanel("Priorities", result.health.priorities.length > 0 ? result.health.priorities.map(priority => `${priority.label} [${priority.impact}] - ${priority.detail}`) : ["No urgent priorities detected."], "yellow");
    } catch (err) {
      console.error("Health command failed:", err);
      process.exitCode = 2;
    }
  });

program
  .command("hotspots")
  .description("List the files with the highest issue density")
  .action(async () => {
    try {
      const result = await runScanWorkflow(process.cwd());
       printBanner();
      const hotspots = buildHotspots(result.report, 10);
      printPanel("Hotspots", hotspots.length > 0 ? hotspots.map(hotspot => `${hotspot.filePath}  score=${hotspot.score}  errors=${hotspot.errors}  warnings=${hotspot.warnings}`) : ["No hotspots found."], "red");
    } catch (err) {
      console.error("Hotspots command failed:", err);
      process.exitCode = 2;
    }
  });

addScopeOptions(
  program
    .command("check-accessibility")
    .description("Show only accessibility-related findings for the selected scope")
    .action(async (opts: { changed?: boolean; staged?: boolean }) => {
      try {
        const report = await runAccessibilityWorkflow(process.cwd(), opts);
        printBanner();
        printSummary(report);
        const explanationLines = report.files.flatMap(file => file.messages.slice(0, 2).map(message => {
          const explanation = explainMessage(message);
          return `${file.filePath}: ${explanation.title} | ${explanation.fix}`;
        }));
        printPanel("Accessibility Guidance", explanationLines.length > 0 ? explanationLines.slice(0, 10) : ["No accessibility issues were detected in the selected scope."], "blue");
      } catch (err) {
        console.error("Accessibility command failed:", err);
        process.exitCode = 2;
      }
    })
);

addScopeOptions(
  program
    .command("review")
    .description("Generate a PR-style summary for the selected scope")
    .option("--out <file>", "Optional file to write the markdown summary to")
    .action(async (opts: { changed?: boolean; staged?: boolean; out?: string }) => {
      try {
        const result = await runReviewWorkflow(process.cwd(), opts);
        printBanner();
        printPanel("Review Scope", [
          `${chalk.cyan("Scope:")} ${result.scope}`,
          `${chalk.cyan("Score:")} ${result.report.summary.score}/100`,
          `${chalk.cyan("Issues:")} ${result.report.summary.errors} errors, ${result.report.summary.warnings} warnings`,
          opts.out ? `${chalk.cyan("Written to:")} ${path.resolve(opts.out)}` : chalk.dim("Use --out review.md to save this summary.")
        ], "cyan");
        console.log(`\n${result.body}\n`);
      } catch (err) {
        console.error("Review command failed:", err);
        process.exitCode = 2;
      }
    })
);

addScopeOptions(
  program
    .command("pr-summary")
    .description("Generate a pull-request summary, defaulting to changed files")
    .option("--out <file>", "Optional file to write the markdown summary to")
    .action(async (opts: { changed?: boolean; staged?: boolean; out?: string }) => {
      try {
        const result = await runPrSummaryWorkflow(process.cwd(), opts);
        printBanner();
        printPanel("PR Summary", [
          `${chalk.cyan("Scope:")} ${result.scope}`,
          `${chalk.cyan("Score:")} ${result.report.summary.score}/100`,
          `${chalk.cyan("Issues:")} ${result.report.summary.totalIssues}`,
          opts.out ? `${chalk.cyan("Written to:")} ${path.resolve(opts.out)}` : chalk.dim("Use --out pr-summary.md to save this summary.")
        ], "cyan");
        console.log(`\n${result.body}\n`);
      } catch (err) {
        console.error("PR summary command failed:", err);
        process.exitCode = 2;
      }
    })
);

program
  .command("compare")
  .description("Compare the current scan with the most recent saved snapshot")
  .action(async () => {
    try {
      const previous = loadLatestSnapshot(process.cwd());
      const result = await runCompareWorkflow(process.cwd());
        printBanner();

      if (!previous || !result.delta) {
        printPanel("Compare", ["No previous snapshot was found. A new snapshot has been saved for future comparisons."], "yellow");
        return;
      }

      printPanel("Comparison", [
        `${chalk.cyan("Score delta:")} ${formatDelta(result.delta.scoreDelta)}`,
        `${chalk.cyan("Error delta:")} ${formatDelta(result.delta.errorDelta)}`,
        `${chalk.cyan("Warning delta:")} ${formatDelta(result.delta.warningDelta)}`,
        `${chalk.cyan("Files delta:")} ${formatDelta(result.delta.fileDelta)}`
      ], "green");
    } catch (err) {
      console.error("Compare command failed:", err);
      process.exitCode = 2;
    }
  });

program
  .command("explain [target]")
  .description("Explain why findings matter and how to fix them for a report or file")
  .action(async (target?: string) => {
    try {
      const result = await runExplainWorkflow(process.cwd(), target);
      printBanner();
      printPanel("Explain", [
        `${chalk.cyan("Target:")} ${result.target}`,
        `${chalk.cyan("Files with issues:")} ${result.report.summary.filesWithIssues}`,
        `${chalk.cyan("Total issues:")} ${result.report.summary.totalIssues}`
      ], "magenta");
      console.log(`\n${result.summary}\n`);
    } catch (err) {
      console.error("Explain command failed:", err);
      process.exitCode = 2;
    }
  });

program
  .command("commands")
  .description("Show the full command catalog and slash aliases")
  .action(() => {
    printBanner();
    printCommandCatalog();
    printPanel("Examples", COMMANDS.slice(0, 5).map(command => `${chalk.cyan(command.slash)} -> ${command.example}`), "magenta");
  });

program
  .command("menu")
  .description("Alias for the full-screen terminal UI")
  .action(async () => {
    await runTui();
  });

program
  .command("init")
  .description("Interactive assistant to set up better-ui in your project")
  .option("--preset <name>", "Preset: react, next, vite, vue, design-system, landing-page, typescript-library")
  .action(async (opts: { preset?: string }) => {
    try {
      const result = await runInit(process.cwd(), opts);
      console.log("\nSetup complete. Try `better-ui /menu` for the command center or `better-ui /scan` to generate a report.");
      if (result?.openTui) {
        await runTui();
      }
    } catch (err) {
      console.error("Init failed:", err);
      process.exitCode = 2;
    }
  });

program
  .command("tui")
  .description("Start the interactive command center")
  .action(async () => {
    try {
      await runTui();
    } catch (err) {
      console.error("TUI failed:", err);
      process.exitCode = 2;
    }
  });

program
  .command("images")
  .description("Scan images and optionally generate WebP versions")
  .option("--generate", "Generate WebP files for detected images")
  .action(async (opts: { generate?: boolean }) => {
    try {
      const projectRoot = process.cwd();
      const images = await scanImages(projectRoot);
      printBanner();

      if (images.length === 0) {
        printPanel("Images", ["No PNG, JPG, or JPEG assets were found."], "green");
        return;
      }

      const totalKb = Math.round(images.reduce((sum, image) => sum + image.size, 0) / 1024);
      printPanel("Image Inventory", [
        `${chalk.cyan("Files:")} ${String(images.length)}`,
        `${chalk.cyan("Total size:")} ${String(totalKb)} KB`,
        ...images.slice(0, 8).map(image => `${image.file} (${Math.round(image.size / 1024)} KB)`)
      ], "blue");

      if (opts.generate) {
        const results: string[] = [];
        for (const image of images) {
          try {
        const generated = await generateWebP(projectRoot, image.file);
            results.push(`${generated.out} (${Math.round(generated.size / 1024)} KB)`);
          } catch (err) {
            results.push(`${image.file} (failed: ${String(err)})`);
          }
        }
        printPanel("Generated WebP", results.slice(0, 12), "magenta");
      }
    } catch (err) {
      console.error("Image scan failed:", err);
      process.exitCode = 2;
    }
  });

const normalizedArgv = normalizeSlashArgv(process.argv);

// If normalizeSlashArgv returned an argv array (it may exit the process if enforcement fails),
// pass it through to commander. When no arguments were provided, keep the existing behavior
// which shows help.
if (normalizedArgv.length <= 2) {
  program.help();
} else {
  program.parseAsync(normalizedArgv);
}

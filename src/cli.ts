import { Command } from "commander";
import path from "path";
import chalk from "chalk";
import { prompt } from "enquirer";
import fs from "fs";
import { exec } from "child_process";
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
import { printBanner, printCommandCatalog, printPanel, formatDelta, printGrid } from "./terminalUi";
import { runTui } from "./tui/app";
import { scanDependencies } from "./scanners/dependencyScanner";

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
    .option("--skip-history", "Do not save a history snapshot to .better-ui/history")
    .option("--top <n>", "Number of hotspots to show", (v) => parseInt(v, 10), 5)
    .option("--open", "Open the generated HTML report with the system default application")
    .option("--scan-images", "Also scan images and show an image summary")
    .option("--verbose", "Show extended output after the scan")
    .action(async (opts: any) => {
      // opts is 'any' here to avoid over-specific typing for the extended options
      try {
        const projectRoot = process.cwd();
        const start = Date.now();

        const result = await runScanWorkflow(projectRoot, {
          out: opts.out,
          ext: parseExtensions(opts.ext),
          changed: opts.changed,
          staged: opts.staged,
          format: opts.format,
          // only pass saveHistory=false when user explicitly asked to skip
          saveHistory: opts.skipHistory ? false : undefined
        });

        const durationMs = Date.now() - start;

        // compute extra metrics
        const fixableCount = result.report.files.reduce((sum, f) => sum + f.messages.filter((m: any) => m.fixable).length, 0);
        const top = Number.isFinite(opts.top) ? Math.max(1, opts.top) : 5;
        const hotspots = buildHotspots(result.report, top);

        const fixableFiles = result.report.files
          .map(f => ({ filePath: f.filePath, fixables: f.messages.filter((m: any) => m.fixable).length }))
          .filter(x => x.fixables > 0)
          .sort((a, b) => b.fixables - a.fixables)
          .slice(0, Math.max(5, top));

        const categories = Object.entries(result.report.summary.categories || {}).sort((a: any, b: any) => (b[1] as number) - (a[1] as number));

        // report file size (if written)
        let reportSizeText = "unknown";
        try {
          if (result.reportPath && fs.existsSync(result.reportPath)) {
            const st = fs.statSync(result.reportPath);
            reportSizeText = `${Math.round(st.size / 1024)} KB`;
          }
        } catch {
          // ignore
        }

        printBanner();
        printSummary(result.report);

        printPanel("Scan Output", [
          `${chalk.cyan("Scope:")} ${result.report.scope || "all"}`,
          `${chalk.cyan("Saved report:")} ${result.reportPath ? path.resolve(result.reportPath) : "(not written)"}`,
          `${chalk.cyan("History snapshot:")} ${result.snapshotPath ? path.resolve(result.snapshotPath) : "disabled"}`,
          `${chalk.cyan("Report size:")} ${reportSizeText}`,
          `${chalk.cyan("Duration:")} ${(durationMs / 1000).toFixed(2)}s`,
          `${chalk.cyan("Files with issues:")} ${result.report.summary.filesWithIssues}`,
          `${chalk.cyan("Total issues:")} ${result.report.summary.totalIssues}`,
          `${chalk.cyan("Autofixable issues:")} ${fixableCount}`
        ], "cyan");

        // Category breakdown
        printPanel("Category Breakdown", categories.length > 0 ? categories.map(([name, count]) => `${chalk.cyan(String(name) + ":")} ${String(count)}`) : ["No categorized issues detected."], "blue");

        // Hotspots
        printPanel("Hotspots", hotspots.length > 0 ? hotspots.map(h => `${h.filePath}  score=${h.score}  errors=${h.errors}  warnings=${h.warnings}`) : ["No hotspots found."], "red");

        // Fixable files
        printPanel("Top Fixable Files", fixableFiles.length > 0 ? fixableFiles.map(f => `${f.filePath} (${f.fixables} autofixable)`) : ["No autofixable files found in this scan."], "yellow");

        // Optionally scan images
        if (opts.scanImages) {
          try {
            const images = await scanImages(projectRoot);
            const totalKb = Math.round(images.reduce((s, i) => s + i.size, 0) / 1024);
            printPanel("Image Inventory", [
              `${chalk.cyan("Files:")} ${String(images.length)}`,
              `${chalk.cyan("Total size:")} ${String(totalKb)} KB`,
              ...images.slice(0, 8).map(image => `${image.file} (${Math.round(image.size / 1024)} KB)`)
            ], "magenta");
          } catch (err) {
            console.warn("Image scan failed:", err);
          }
        }

        // actionable suggestions
        const suggestions: string[] = [];
        if (fixableCount > 0) {
          suggestions.push(`${chalk.cyan("Autofix available:")} ${fixableCount} issue(s) — run ${chalk.bold("better-ui-cli /fix --interactive")} to pick hunks or ${chalk.bold("better-ui-cli /fix --apply")} to apply all autofixes.`);
        } else {
          suggestions.push("No autofixable issues detected. Consider addressing errors and warnings listed above.");
        }
        suggestions.push(`${chalk.cyan("Review:")} ${chalk.bold("better-ui-cli /review --changed")} or ${chalk.bold("better-ui-cli /pr-summary --out pr-summary.md")}`);
        suggestions.push(`${chalk.cyan("Health:")} ${chalk.bold("better-ui-cli /health")} for category scores and priorities.`);
        printPanel("Next Steps", suggestions, "green");

        // Optionally open generated HTML report
        if (opts.open) {
          if (result.reportPath && String(result.reportPath).toLowerCase().endsWith(".html")) {
            try {
              // platform-specific open
              if (process.platform === "win32") {
                exec(`start "" "${result.reportPath}"`);
              } else if (process.platform === "darwin") {
                exec(`open "${result.reportPath}"`);
              } else {
                exec(`xdg-open "${result.reportPath}"`);
              }
              printPanel("Opened Report", ["The HTML report was opened in your default application."], "magenta");
            } catch (err) {
              printPanel("Open Report", ["Could not open the report automatically. Please open the file manually:" , String(result.reportPath)], "yellow");
            }
          } else {
            printPanel("Open Report", ["The --open option works only for HTML reports. Re-run with --format html or open the file manually."], "yellow");
          }
        }

        if (opts.verbose) {
          printPanel("Raw Report Path", [String(result.reportPath)], "cyan");
          if (result.snapshotPath) printPanel("Snapshot Path", [String(result.snapshotPath)], "cyan");
        }
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
      printPanel("Project Health", [
        `${chalk.cyan("Score:")} ${result.health.score}/100`,
        `${chalk.cyan("High impact issues:")} ${result.health.summary.highImpactIssues}`,
        `${chalk.cyan("Safe autofixes:")} ${result.health.summary.safeAutofixes}`
      ], "magenta");
      printPanel("Priorities", result.health.priorities.map((priority: any) => `${priority.label} - ${priority.detail}`), "blue");
    } catch (error) {
      console.error(chalk.red("Health check failed:"), error);
      process.exit(1);
    }
  });

program
  .command("deps")
  .description("Find unused dependencies and heavy packages")
  .action(async () => {
    try {
      printPanel("Dependencies", ["Scanning project for unused and heavy dependencies..."], "yellow");
      const { unusedDependencies, heavyDependencies } = await scanDependencies(process.cwd());
      if (unusedDependencies.length > 0) {
        printPanel("Dead Code / Unused Dependencies", unusedDependencies.map(d => chalk.red(`- ${d}`)), "red");
      } else {
        printPanel("Dead Code / Unused Dependencies", ["All package.json dependencies seem to be used!"], "green");
      }

      if (heavyDependencies.length > 0) {
        printPanel("Heavy Dependencies Detected", heavyDependencies.map(d => chalk.yellow(`- ${d.name}`)), "yellow");
      }
    } catch (error) {
      console.error(chalk.red("Dependency scan failed:"), error);
      process.exit(1);
    }
  });

program
  .command("advanced")
  .description("Show advanced subcommands, flags, and hidden pro-tips")
  .action(() => {
    printGrid([
      {
        title: "Supercharged Scan",
        color: "cyan",
        lines: [
          chalk.yellow("--changed") + "       : Scan only modified/untracked files",
          chalk.yellow("--staged") + "        : Scan only files ready to commit",
          chalk.yellow("--scan-images") + "   : Discover heavy images during scan",
          chalk.yellow("--format html") + "   : Generate a visual dashboard",
          chalk.yellow("--open") + "          : Open the HTML report in your browser"
        ]
      },
      {
        title: "Surgical Fixes",
        color: "green",
        lines: [
          chalk.yellow("/fix --interactive") + " : Pick diffs one by one (Space to select)",
          chalk.yellow("/fix --apply") + "       : Auto-fix everything safely"
        ]
      },
      {
        title: "Pull Requests & Git",
        color: "magenta",
        lines: [
          chalk.yellow("/review --changed") + "  : Generate a Code Review for your diff",
          chalk.yellow("/pr-summary") + "        : Drafts the markdown for your GitHub PR"
        ]
      },
      {
        title: "Hidden Features",
        color: "blue",
        lines: [
          chalk.yellow("Ctrl+Shift+S") + "       : Open the Command Palette from anywhere",
          chalk.yellow("/images --generate") + " : Auto-convert heavy images to .webp"
        ]
      }
    ]);
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
      console.log("\nSetup complete. Try `better-ui-cli /menu` for the command center or `better-ui-cli /scan` to generate a report.");
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
  .option("--quality <n>", "WebP quality from 1 to 100", (value) => parseInt(value, 10))
  .action(async (opts: { generate?: boolean; quality?: number }) => {
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
            const generated = await generateWebP(projectRoot, image.file, opts.quality);
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

// Bare `better-ui-cli` opens the command center. Any explicit action beyond that must still use
// a slash-prefixed command so the public CLI stays slash-first.
if (normalizedArgv.length <= 2) {
  program.parseAsync([process.argv[0], process.argv[1], "menu"]);
} else {
  program.parseAsync(normalizedArgv);
}

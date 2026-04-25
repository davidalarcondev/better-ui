import { prompt } from "enquirer";
// Use runtime require to access the Input prompt class without TypeScript type errors
const Enquirer: any = require("enquirer");
const Input: any = Enquirer.Input;
import path from "path";
import chalk from "chalk";
import { runInit } from "../cli/initCommand";
import { COMMANDS } from "../commandCatalog";
import { loadConfig, getExtensions, getReportFile } from "../config";
import { explainMessage } from "../explanations";
import { getCurrentBranch, isGitRepository } from "../gitUtils";
// snapshot/history removed from TUI
import { buildHotspots } from "../insights";
import { printSummary } from "../reporters/terminalReporter";
import { generateWebP, scanImages } from "../scanners/imageScanner";
import { parseSlashCommand } from "../slashCommands";
import { printBanner, printPanel } from "../terminalUi";
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
} from "../cli/workflows";

async function pause(message = "Press enter to return to the command center") {
  await prompt({ type: "input", name: "continue", message: chalk.dim(message), initial: "" } as any);
}

function isPromptCloseError(error: unknown) {
  const maybeError = error as { code?: string; message?: string } | undefined;
  return maybeError?.code === "ERR_USE_AFTER_CLOSE"
    || maybeError?.message?.includes("readline was closed")
    || false;
}

async function showCommandPalette() {
  try {
    const header = `${chalk.bold("Command Palette")} - type to filter, Enter to select`;
    const choices = COMMANDS
      .filter(command => command.slash !== "/commands" && command.slash !== "/help")
      .map(command => ({
        name: command.slash,
        message: `${chalk.bold(command.slash)} ${chalk.dim("- " + command.description)}`
      }));

    const answer: any = await prompt({
      type: "select",
      name: "command",
      message: header,
      limit: 14,
      choices
    } as any);

    return { shouldExit: false, commandInput: answer.command as string | undefined };
  } catch {
    return { shouldExit: false, commandInput: undefined };
  }
}

function readFlag(tokens: string[], flag: string) {
  return tokens.includes(flag);
}

function readOption(tokens: string[], option: string) {
  const index = tokens.indexOf(option);
  return index >= 0 ? tokens[index + 1] : undefined;
}

async function runSlashCommand(cwd: string, input: string) {
  const tokens = parseSlashCommand(input);
  if (!tokens || tokens.length === 0) {
    printPanel("Slash Command", ["Command not recognized. Try /help or /menu."], "yellow");
    return { shouldExit: false };
  }

  const [command] = tokens;

  if (command === "scan") {
    const result = await runScanWorkflow(cwd, {
      changed: readFlag(tokens, "--changed"),
      staged: readFlag(tokens, "--staged"),
      out: readOption(tokens, "--out"),
      format: (readOption(tokens, "--format") as "json" | "markdown" | undefined) || "json"
    });
    printSummary(result.report);
    printPanel("Scan Output", [`Saved report to ${result.reportPath}`], "cyan");
    return { shouldExit: false };
  }

  if (command === "fix") {
    if (readFlag(tokens, "--interactive")) {
      const interactive = await runInteractiveFixWorkflow(cwd, {
        changed: readFlag(tokens, "--changed"),
        staged: readFlag(tokens, "--staged")
      });
      if (interactive.previews.length === 0) {
        printPanel("Interactive Fix", ["No autofixes are available for this scope."], "green");
        return { shouldExit: false };
      }
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
        printPanel("Interactive Fix", ["No diff blocks were selected."], "yellow");
        return { shouldExit: false };
      }
      printPanel("Selected Diff Preview", interactive.previews.flatMap(preview => preview.hunks.filter(hunk => selectedHunks.includes(hunk.id)).flatMap(hunk => [hunk.label, ...hunk.preview.slice(0, 4)])).slice(0, 24), "cyan");
      const confirm: any = await prompt({
        type: "confirm",
        name: "approved",
        message: `Apply ${selectedHunks.length} selected diff blocks?`,
        initial: false
      } as any);
      if (!confirm.approved) {
        printPanel("Interactive Fix", ["Cancelled before writing changes."], "yellow");
        return { shouldExit: false };
      }
      const report = await applyInteractiveHunkSelection(cwd, interactive.previews, selectedHunks, {
        changed: readFlag(tokens, "--changed"),
        staged: readFlag(tokens, "--staged")
      });
      printPanel("Interactive Fix Applied", [
        `${chalk.cyan("Blocks applied:")} ${selectedHunks.length}`,
        `${chalk.cyan("Remaining errors:")} ${report.summary.errors}`,
        `${chalk.cyan("Remaining warnings:")} ${report.summary.warnings}`
      ], "green");
      return { shouldExit: false };
    }

    const result = await runFixWorkflow(cwd, {
      apply: readFlag(tokens, "--apply"),
      changed: readFlag(tokens, "--changed"),
      staged: readFlag(tokens, "--staged")
    });
    printPanel(result.preview ? "Fix Preview" : "Fix Applied", [
      `${chalk.cyan("Scope:")} ${result.report.scope || "all"}`,
      `${chalk.cyan("Errors:")} ${result.report.summary.errors}`,
      `${chalk.cyan("Warnings:")} ${result.report.summary.warnings}`
    ], result.preview ? "yellow" : "green");
    return { shouldExit: false };
  }

  if (command === "doctor") {
    const result = await runDoctorWorkflow(cwd);
    printPanel("Doctor Overview", [
      `${chalk.cyan("Score:")} ${result.health.score}/100`,
      `${chalk.cyan("Config completeness:")} ${result.doctor.configCompleteness}`,
      `${chalk.cyan("Scripts present:")} ${result.doctor.scriptsPresent}/${result.doctor.scriptChecks}`
    ], "magenta");
    printPanel("Doctor Findings", [
      result.doctor.missingConfig.length > 0 ? `Missing config fields: ${result.doctor.missingConfig.join(", ")}` : "Config file looks complete.",
      result.doctor.missingScripts.length > 0 ? `Missing helper scripts: ${result.doctor.missingScripts.join(", ")}` : "Helper scripts are present."
    ], "yellow");
    return { shouldExit: false };
  }

  if (command === "health") {
    const result = await runHealthWorkflow(cwd);
    printPanel("Project Health", [
      `${chalk.cyan("Score:")} ${result.health.score}/100`,
      `${chalk.cyan("High impact issues:")} ${result.health.summary.highImpactIssues}`,
      `${chalk.cyan("Safe autofixes:")} ${result.health.summary.safeAutofixes}`
    ], "magenta");
    printPanel("Priorities", result.health.priorities.map(priority => `${priority.label} - ${priority.detail}`), "blue");
    return { shouldExit: false };
  }

  if (command === "hotspots") {
    const result = await runScanWorkflow(cwd);
    const hotspots = buildHotspots(result.report, 8);
    printPanel("Hotspots", hotspots.length > 0 ? hotspots.map(hotspot => `${hotspot.filePath}  score=${hotspot.score}`) : ["No hotspots found."], "red");
    return { shouldExit: false };
  }

  if (command === "review") {
    const result = await runReviewWorkflow(cwd, {
      changed: readFlag(tokens, "--changed"),
      staged: readFlag(tokens, "--staged"),
      out: readOption(tokens, "--out")
    });
    printPanel("Review Summary", [
      `${chalk.cyan("Scope:")} ${result.scope}`,
      `${chalk.cyan("Score:")} ${result.report.summary.score}/100`
    ], "cyan");
    console.log(`\n${result.body}\n`);
    return { shouldExit: false };
  }

  if (command === "pr-summary") {
    const result = await runPrSummaryWorkflow(cwd, {
      changed: readFlag(tokens, "--changed"),
      staged: readFlag(tokens, "--staged"),
      out: readOption(tokens, "--out")
    });
    printPanel("PR Summary", [
      `${chalk.cyan("Scope:")} ${result.scope}`,
      `${chalk.cyan("Score:")} ${result.report.summary.score}/100`
    ], "cyan");
    console.log(`\n${result.body}\n`);
    return { shouldExit: false };
  }

  if (command === "check-accessibility") {
    const report = await runAccessibilityWorkflow(cwd, {
      changed: readFlag(tokens, "--changed"),
      staged: readFlag(tokens, "--staged")
    });
    printSummary(report);
    printPanel("Accessibility Guidance", report.files.flatMap(file => file.messages.slice(0, 2).map(message => {
      const explanation = explainMessage(message);
      return `${file.filePath}: ${explanation.fix}`;
    })).slice(0, 12), "blue");
    return { shouldExit: false };
  }

  if (command === "compare") {
    const result = await runCompareWorkflow(cwd);
    if (!result.delta) {
      printPanel("Comparison", ["No previous snapshot exists yet. A baseline has now been saved."], "yellow");
      return { shouldExit: false };
    }
    printPanel("Comparison", [
      `${chalk.cyan("Score delta:")} ${result.delta.scoreDelta}`,
      `${chalk.cyan("Error delta:")} ${result.delta.errorDelta}`,
      `${chalk.cyan("Warning delta:")} ${result.delta.warningDelta}`
    ], "green");
    return { shouldExit: false };
  }

  if (command === "explain") {
    const result = await runExplainWorkflow(cwd, tokens[1]);
    printPanel("Explain", [
      `${chalk.cyan("Target:")} ${result.target}`,
      `${chalk.cyan("Total issues:")} ${result.report.summary.totalIssues}`
    ], "magenta");
    console.log(`\n${result.summary}\n`);
    return { shouldExit: false };
  }

  if (command === "images") {
    const images = await scanImages(cwd);
    printPanel("Image Inventory", images.length > 0 ? images.slice(0, 10).map(image => `${image.file} (${Math.round(image.size / 1024)} KB)`) : ["No images found."], "blue");
    if (readFlag(tokens, "--generate")) {
      const generated: string[] = [];
      for (const image of images) {
        try {
          const result = await generateWebP(cwd, image.file);
          generated.push(`${result.out} (${Math.round(result.size / 1024)} KB)`);
        } catch (err) {
          generated.push(`${image.file} (failed: ${String(err)})`);
        }
      }
      printPanel("Generated WebP", generated.slice(0, 12), "magenta");
    }
    return { shouldExit: false };
  }

  if (command === "init") {
    const result = await runInit(cwd, { preset: readOption(tokens, "--preset") });
    printPanel("Setup", ["Configuration updated.", result.openTui ? "The command center is already open here." : "Run /menu later to reopen the TUI."], "green");
    return { shouldExit: false };
  }

  if (command === "commands") {
    return { shouldExit: false, showCatalog: true };
  }

  if (command === "tui") {
    printPanel("Command Center", ["You are already inside the command center."], "green");
    return { shouldExit: false };
  }

  if (command === "exit") {
    printPanel("Command Center", ["Leaving better-ui."], "green");
    return { shouldExit: true };
  }

  printPanel("Slash Command", [`Unsupported command: /${command}`], "red");
  return { shouldExit: false };
}

export async function runTui() {
  const cwd = process.cwd();

  while (true) {
    const config = loadConfig(cwd);
    const defaultExts = getExtensions(config) || [".js", ".jsx", ".ts", ".tsx"];
    const reportPath = getReportFile(cwd, config);
    const gitEnabled = isGitRepository(cwd);

    console.clear();
    printBanner();
    printPanel("Workspace", [
      `${chalk.cyan("Path:")} ${cwd}`,
      `${chalk.cyan("Report:")} ${path.basename(reportPath)}`,
      `${chalk.cyan("Extensions:")} ${defaultExts.join(", ")}`,
      `${chalk.cyan("Git:")} ${gitEnabled ? getCurrentBranch(cwd) || "attached" : "not a repository"}`
    ], "magenta");

    printPanel("Slash Actions", [
      "Type a slash command below (eg. /scan --format json).",
      "Press Enter to run the command."
    ], "cyan");

    printPanel("Commands (Ctrl+Shift+S)", [
      "Press Ctrl+Shift+S to open the command palette.",
      "You can also type /commands to open the same palette."
    ], "yellow");

    printPanel("Exit", ["Press Esc to exit better-ui."], "red");

    const input = new Input({
      name: "action",
      message: chalk.bold("What do you want to do? Type a slash command starting with '/'."),
      initial: "/"
    });

    let showCatalog = false;
    let exitFromPrompt = false;
    const onCatalogData = (chunk: Buffer) => {
      if (chunk[0] === 19) {
        showCatalog = true;
        try { (input as any).cancel(); } catch (_) {}
        return;
      }

      if (chunk[0] === 3) {
        exitFromPrompt = true;
        try { (input as any).cancel(); } catch (_) {}
        return;
      }

      if (chunk[0] === 27 && chunk.length === 1) {
        exitFromPrompt = true;
        try { (input as any).cancel(); } catch (_) {}
      }
    };

    input.on("keypress", (_ch: any, key: any) => {
      if (key && key.ctrl && key.name === "s") {
        showCatalog = true;
        try { (input as any).cancel(); } catch (_) {}
        return;
      }

      if (key && key.ctrl && key.name === "c") {
        exitFromPrompt = true;
        try { (input as any).cancel(); } catch (_) {}
      }
    });

    if (process.stdin) {
      process.stdin.on("data", onCatalogData);
    }

    try {
      const answer = await input.run();
      if (process.stdin) {
        process.stdin.off("data", onCatalogData);
      }

      if (showCatalog) {
        const catalog = await showCommandPalette();
        showCatalog = false;
        if (catalog.commandInput) {
          const selected = await runSlashCommand(cwd, catalog.commandInput);
          if (selected.showCatalog) {
            continue;
          }
          if (selected.shouldExit) {
            console.clear();
            console.log(chalk.dim("Leaving better-ui."));
            return;
          }
          await pause();
        }
        continue;
      }

      if (exitFromPrompt) {
        console.clear();
        console.log(chalk.dim("Leaving better-ui."));
        return;
      }

      let commandInput = (answer || "").toString().trim();
      if (!commandInput.startsWith("/")) {
        printPanel("Slash Command", ["Please type a command that starts with '/' (e.g. /scan --format json)"], "yellow");
        await pause();
        continue;
      }

      const result = await runSlashCommand(cwd, commandInput);
      if (result.showCatalog) {
        const catalog = await showCommandPalette();
        if (catalog.commandInput) {
          const selected = await runSlashCommand(cwd, catalog.commandInput);
          if (selected.shouldExit) {
            console.clear();
            console.log(chalk.dim("Leaving better-ui."));
            return;
          }
          await pause();
        }
        continue;
      }

      if (result.shouldExit) {
        console.clear();
        console.log(chalk.dim("Leaving better-ui."));
        return;
      }

      await pause();
    } catch (err) {
      if (process.stdin) {
        process.stdin.off("data", onCatalogData);
      }

      if (exitFromPrompt) {
        console.clear();
        console.log(chalk.dim("Leaving better-ui."));
        return;
      }

      if (showCatalog) {
        const catalog = await showCommandPalette();
        showCatalog = false;
        if (catalog.commandInput) {
          const selected = await runSlashCommand(cwd, catalog.commandInput);
          if (selected.shouldExit) {
            console.clear();
            console.log(chalk.dim("Leaving better-ui."));
            return;
          }
          await pause();
        }
        continue;
      }

      if (isPromptCloseError(err)) {
        console.clear();
        console.log(chalk.dim("Leaving better-ui."));
        return;
      }

      console.error("TUI error:", err);
      await pause("An error occurred. Press enter to continue");
    }
  }
}

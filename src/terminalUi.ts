import chalk from "chalk";
import Table from "cli-table3";
import { COMMANDS } from "./commandCatalog";

type PanelColor = "magenta" | "cyan" | "yellow" | "green" | "blue" | "red";

// Replaced the previous brush art with the larger ASCII title requested by the user.
const BRUSH_ART = [
  "/$$$$$$$  /$$$$$$$$ /$$$$$$$$ /$$$$$$$$ /$$$$$$$$ /$$$$$$$          /$$   /$$ /$$$$$$",
  "| $$__  $$| $$_____/|__  $$__/|__  $$__/| $$_____/| $$__  $$        | $$  | $$|_  $$_/",
  "| $$  \\ $$| $$         | $$      | $$   | $$      | $$  \\ $$        | $$  | $$  | $$  ",
  "| $$$$$$$ | $$$$$      | $$      | $$   | $$$$$   | $$$$$$$/ /$$$$$$| $$  | $$  | $$  ",
  "| $$__  $$| $$__/      | $$      | $$   | $$__/   | $$__  $$|______/| $$  | $$  | $$  ",
  "| $$  \\ $$| $$         | $$      | $$   | $$      | $$  \\ $$        | $$  | $$  | $$  ",
  "| $$$$$$$/| $$$$$$$$   | $$      | $$   | $$$$$$$$| $$  | $$        |  $$$$$$/ /$$$$$$",
  "|_______/ |________/   |__/      |__/   |________/|__/  |__/         \\______/ |______/"
];

export function printBanner() {
  // Print only the ASCII title art. We intentionally omit the "project: <label>" line
  // to keep the banner compact and focused on branding.
  const lines = BRUSH_ART.map((line, index) => index < 6 ? chalk.hex("#C084FC")(line) : chalk.hex("#22D3EE")(line));

  console.log(`\n${lines.join("\n")}\n`);
}

export function printPanel(title: string, lines: string[], color: PanelColor = "magenta") {
  const width = Math.max(42, title.length + 4, ...lines.map(line => line.length + 4));
  const paint = color === "cyan"
    ? chalk.cyan
    : color === "yellow"
      ? chalk.yellow
      : color === "green"
        ? chalk.green
        : color === "blue"
          ? chalk.blue
          : color === "red"
            ? chalk.red
            : chalk.magenta;
  const top = `╭${"─".repeat(width - 2)}╮`;
  const bottom = `╰${"─".repeat(width - 2)}╯`;
  console.log(paint(top));
  console.log(paint(`│ ${chalk.bold(title)}${" ".repeat(Math.max(0, width - title.length - 3))}│`));
  for (const line of lines) {
    console.log(paint(`│ ${line}${" ".repeat(Math.max(0, width - line.length - 3))}│`));
  }
  console.log(paint(bottom));
}

export function printCommandCatalog() {
  const table = new Table({
    head: [chalk.cyan("Command"), chalk.cyan("Slash"), chalk.cyan("Description")],
    style: { head: [], border: ["gray"] },
    wordWrap: true,
    colWidths: [24, 14, 70]
  });

  for (const command of COMMANDS) {
    table.push([command.name, command.slash, command.description]);
  }

  console.log(table.toString());
}

export function formatDelta(value: number) {
  if (value === 0) {
    return chalk.gray("0");
  }

  return value > 0 ? chalk.red(`+${value}`) : chalk.green(String(value));
}

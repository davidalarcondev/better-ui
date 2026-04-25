export interface CommandDefinition {
  name: string;
  slash: string;
  description: string;
  example: string;
}

export const COMMANDS: CommandDefinition[] = [
  {
    name: "scan",
    slash: "/scan",
    description: "Scan the whole project and save a structured report.",
    example: "better-ui /scan --format html --out report.html"
  },
  {
    name: "scan --changed",
    slash: "/changed",
    description: "Scan only modified and untracked files in the current git worktree.",
    example: "better-ui /changed"
  },
  {
    name: "scan --staged",
    slash: "/staged",
    description: "Scan only staged files before a commit.",
    example: "better-ui /staged"
  },
  {
    name: "fix",
    slash: "/fix",
    description: "Preview fixes or apply ESLint autofixes when requested.",
    example: "better-ui /fix --apply"
  },
  {
    name: "fix",
    slash: "/fix-preview",
    description: "Run the same dry-run fix preview shown by the TUI preview action.",
    example: "better-ui /fix-preview"
  },
  {
    name: "fix --apply",
    slash: "/fix-apply",
    description: "Apply ESLint autofixes directly, matching the TUI apply-fixes action.",
    example: "better-ui /fix-apply"
  },
  {
    name: "fix --interactive",
    slash: "/fix-interactive",
    description: "Preview autofixes and choose which files to update.",
    example: "better-ui /fix --interactive"
  },
  {
    name: "health",
    slash: "/health",
    description: "Build a frontend health score with category breakdowns and priorities.",
    example: "better-ui /health"
  },
  {
    name: "doctor",
    slash: "/doctor",
    description: "Run the broad project doctor view including config and script checks.",
    example: "better-ui /doctor"
  },
  {
    name: "hotspots",
    slash: "/hotspots",
    description: "Show the files with the highest issue density and risk.",
    example: "better-ui /hotspots"
  },
  {
    name: "check-accessibility",
    slash: "/a11y",
    description: "Show only accessibility-related findings for the selected scope.",
    example: "better-ui /a11y --changed"
  },
  {
    name: "review",
    slash: "/review",
    description: "Generate a PR-style summary for changed or staged files.",
    example: "better-ui /review --changed"
  },
  {
    name: "review --changed",
    slash: "/review-changed",
    description: "Run the same changed-files review action exposed in the TUI.",
    example: "better-ui /review-changed"
  },
  {
    name: "review --staged",
    slash: "/review-staged",
    description: "Run the same staged-files review action exposed in the TUI.",
    example: "better-ui /review-staged"
  },
  {
    name: "pr-summary",
    slash: "/pr-summary",
    description: "Generate a pull-request summary, defaulting to changed files.",
    example: "better-ui /pr-summary --out pr-summary.md"
  },
  {
    name: "compare",
    slash: "/compare",
    description: "Compare the current scan with the last saved snapshot.",
    example: "better-ui /compare"
  },
  {
    name: "explain",
    slash: "/explain",
    description: "Explain why findings matter and how to fix them.",
    example: "better-ui /explain src/components/App.tsx"
  },
  {
    name: "images",
    slash: "/images",
    description: "Inspect image weight and optionally create WebP versions.",
    example: "better-ui /images --generate"
  },
  {
    name: "init",
    slash: "/init",
    description: "Create `better-ui.config.json` with optional project presets and helper scripts.",
    example: "better-ui /init --preset next"
  },
  {
    name: "tui",
    slash: "/menu",
    description: "Open the full-screen command menu and dashboard.",
    example: "better-ui /menu"
  },
  {
    name: "commands",
    slash: "/help",
    description: "List every command, slash alias, and what it does.",
    example: "better-ui /commands"
  },
  {
    name: "commands",
    slash: "/commands",
    description: "Alias for the full command catalog from inside the TUI palette.",
    example: "better-ui /commands"
  },
  {
    name: "exit",
    slash: "/exit",
    description: "Leave the TUI directly from the slash-command palette.",
    example: "better-ui /menu"
  }
];

export function getCommandBySlash(slash: string) {
  return COMMANDS.find(command => command.slash === slash);
}

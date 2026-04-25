import fs from "fs";
import path from "path";
import { resolveProjectPath } from "./projectPaths";

export interface BetterUiConfig {
  projectName?: string;
  preset?: string;
  defaults?: {
    reportFile?: string;
    extensions?: string[];
  };
  scripts?: {
    scan?: string;
    fix?: string;
  };
}

export function getConfigPath(projectRoot: string) {
  return resolveProjectPath(projectRoot, "better-ui.config.json", "Config file");
}

export function loadConfig(projectRoot: string): BetterUiConfig {
  const configPath = getConfigPath(projectRoot);
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8")) as BetterUiConfig;
  } catch (err) {
    console.warn(`Warning: could not read ${configPath}: ${err}`);
    return {};
  }
}

export function getProjectLabel(projectRoot: string, config: BetterUiConfig) {
  return config.projectName?.trim() || path.basename(projectRoot) || "better-ui";
}

export function getReportFile(projectRoot: string, config: BetterUiConfig, explicitOut?: string, format?: "json" | "markdown" | "html") {
  const fallback = format === "html" ? "report.html" : format === "markdown" ? "report.md" : "report.json";
  const configuredDefault = config.defaults?.reportFile;
  const configuredPath = explicitOut
    || (configuredDefault && format === "html" && configuredDefault.toLowerCase().endsWith(".json") ? configuredDefault.replace(/\.json$/i, ".html") : undefined)
    || (configuredDefault && format === "markdown" && configuredDefault.toLowerCase().endsWith(".json") ? configuredDefault.replace(/\.json$/i, ".md") : undefined)
    || configuredDefault
    || fallback;
  return resolveProjectPath(projectRoot, configuredPath, "Report output");
}

export function getExtensions(config: BetterUiConfig, explicitExts?: string[]) {
  return explicitExts && explicitExts.length > 0 ? explicitExts : config.defaults?.extensions;
}

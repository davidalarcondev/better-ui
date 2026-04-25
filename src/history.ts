import fs from "fs";
import path from "path";
import { resolveProjectPath } from "./projectPaths";
import { ScanReport, ScanSnapshot } from "./types";

function getHistoryDir(projectRoot: string) {
  return resolveProjectPath(projectRoot, ".better-ui/history", "History directory");
}

export function saveSnapshot(projectRoot: string, report: ScanReport) {
  const historyDir = getHistoryDir(projectRoot);
  fs.mkdirSync(historyDir, { recursive: true });

  const timestamp = report.generatedAt.replace(/[:.]/g, "-");
  const snapshot: ScanSnapshot = {
    savedAt: new Date().toISOString(),
    report
  };

  const filePath = path.join(historyDir, `${timestamp}.json`);
  const latestPath = path.join(historyDir, "latest.json");
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf8");
  fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2), "utf8");
  return filePath;
}

export function loadLatestSnapshot(projectRoot: string) {
  const latestPath = path.join(getHistoryDir(projectRoot), "latest.json");
  if (!fs.existsSync(latestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(latestPath, "utf8")) as ScanSnapshot;
  } catch {
    return null;
  }
}

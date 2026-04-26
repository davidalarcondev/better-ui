import fs from "fs";
import { resolveProjectPath } from "../projectPaths";
import { ScanReport } from "../types";

export function writeHtmlReport(projectRoot: string, reportPath: string, report: ScanReport) {
  const outPath = resolveProjectPath(projectRoot, reportPath, "HTML report output");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Scan Report</title></head><body><h1>Scan Report</h1><pre>${JSON.stringify(report, null, 2)}</pre></body></html>`;
  fs.writeFileSync(outPath, html, "utf8");
  return outPath;
}

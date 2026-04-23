import fs from "fs";
import { ScanReport, FileReport } from "../types";

export function writeJsonReport(outPath: string, files: FileReport[]) {
  const errors = files.reduce((s, f) => s + f.errorCount, 0);
  const warnings = files.reduce((s, f) => s + f.warningCount, 0);

  const report: ScanReport = {
    generatedAt: new Date().toISOString(),
    summary: { errors, warnings },
    files
  };

  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), { encoding: "utf8" });
}

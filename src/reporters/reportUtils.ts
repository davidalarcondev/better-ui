import { buildCategoryCounts, buildScanScore } from "../insights";
import { FileReport, ScanReport } from "../types";

export function buildScanReport(files: FileReport[], options?: Pick<ScanReport, "scope" | "metadata">): ScanReport {
  const errors = files.reduce((sum, file) => sum + file.errorCount, 0);
  const warnings = files.reduce((sum, file) => sum + file.warningCount, 0);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      errors,
      warnings,
      totalIssues: errors + warnings,
      filesWithIssues: files.length,
      score: buildScanScore(files),
      categories: buildCategoryCounts(files)
    },
    files,
    scope: options?.scope,
    metadata: options?.metadata
  };
}

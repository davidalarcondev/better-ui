import { ScanReport, LintMessage, IssueExplanation } from "./types";

export function explainMessage(message: LintMessage): IssueExplanation {
  const title = message.ruleId ? `Rule: ${message.ruleId}` : message.message;
  const why = message.category ? `This is related to ${message.category}.` : "This issue was detected by a linter or heuristic.";
  const fix = message.fixable ? "This can often be auto-fixed with the --apply option or ESLint.fix." : "Manual review required to fix this issue.";
  return {
    title,
    why,
    fix,
    risk: message.impact || "medium",
    autofix: Boolean(message.fixable)
  };
}

export function buildExplainSummary(report: ScanReport, targetPath?: string) {
  const total = report.summary.totalIssues;
  const files = report.summary.filesWithIssues;
  const header = `Report summary: ${total} issue(s) across ${files} file(s)`;
  const top = report.files.slice(0, 6).flatMap(file => file.messages.slice(0, 2).map(m => `- ${file.filePath}: ${m.message}`));
  const body = [header, "", ...top].join("\n");
  return body + (targetPath ? `\n\nTarget: ${targetPath}` : "");
}

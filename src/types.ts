export interface LintMessage {
  ruleId: string | null;
  message: string;
  line: number | null;
  column: number | null;
  severity: number; // 1 = warning, 2 = error
}

export interface FileReport {
  filePath: string;
  errorCount: number;
  warningCount: number;
  messages: LintMessage[];
}

export interface ScanReport {
  generatedAt: string;
  summary: { errors: number; warnings: number };
  files: FileReport[];
}

import fs from "fs";
import path from "path";
import child from "child_process";

export function isGitRepository(projectRoot: string): boolean {
  try {
    return fs.existsSync(path.join(projectRoot, ".git"));
  } catch {
    return false;
  }
}

export function getCurrentBranch(projectRoot: string): string | null {
  try {
    if (!isGitRepository(projectRoot)) return null;
    const out = child.execSync("git rev-parse --abbrev-ref HEAD", { cwd: projectRoot, stdio: ["ignore", "pipe", "ignore"] });
    return out.toString().trim();
  } catch {
    return null;
  }
}

export function getChangedFiles(projectRoot: string, scope: "changed" | "staged"): string[] {
  try {
    if (!isGitRepository(projectRoot)) return [];
    if (scope === "staged") {
      const out = child.execSync("git diff --name-only --cached", { cwd: projectRoot, stdio: ["ignore", "pipe", "ignore"] });
      return out.toString().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }

    const out = child.execSync("git ls-files --modified --others --exclude-standard", { cwd: projectRoot, stdio: ["ignore", "pipe", "ignore"] });
    return out.toString().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

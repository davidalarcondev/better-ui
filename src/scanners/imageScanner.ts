import fs from "fs";
import path from "path";
import sharp from "sharp";
import { resolveProjectPath, toProjectRelativePath } from "../projectPaths";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

export async function scanImages(projectRoot: string) {
  const images: { file: string; size: number }[] = [];
  const resolvedRoot = resolveProjectPath(projectRoot, ".", "Project root");

  async function walk(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isSymbolicLink()) {
        continue;
      }

      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;
        await walk(full);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (IMAGE_EXTENSIONS.has(ext)) {
          const stat = await fs.promises.stat(full);
          images.push({ file: toProjectRelativePath(resolvedRoot, full), size: stat.size });
        }
      }
    }
  }

  await walk(resolvedRoot);
  return images;
}

export async function generateWebP(projectRoot: string, file: string, quality = 75) {
  const normalizedQuality = Math.max(1, Math.min(100, Math.trunc(quality)));
  const full = resolveProjectPath(projectRoot, file, "Image file");
  const extension = path.extname(full).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported image type: ${extension || "unknown"}`);
  }

  const out = full + ".webp";
  await sharp(full).webp({ quality: normalizedQuality }).toFile(out);
  const stat = await fs.promises.stat(out);
  return { out: toProjectRelativePath(projectRoot, out), size: stat.size };
}

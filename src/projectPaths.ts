import path from "path";

function isInsideProject(projectRoot: string, targetPath: string) {
  const relativePath = path.relative(projectRoot, targetPath);
  return relativePath !== "" && !relativePath.startsWith("..") && !path.isAbsolute(relativePath) || targetPath === projectRoot;
}

export function resolveProjectPath(projectRoot: string, targetPath: string, label: string) {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedPath = path.resolve(resolvedRoot, targetPath);

  if (!isInsideProject(resolvedRoot, resolvedPath)) {
    throw new Error(`${label} must stay inside the project root`);
  }

  return resolvedPath;
}

export function toProjectRelativePath(projectRoot: string, targetPath: string) {
  return path.relative(path.resolve(projectRoot), path.resolve(targetPath));
}

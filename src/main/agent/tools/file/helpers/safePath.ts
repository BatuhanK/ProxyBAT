import { resolve, relative } from "path";

export function safePath(workspacePath: string, filePath: string): string {
  const root = resolve(workspacePath);
  const abs = resolve(workspacePath, filePath);
  const rel = relative(root, abs);
  if (rel === ".." || rel.startsWith(".." + "/") || rel.startsWith(".." + "\\")) {
    throw new Error(`Path escape detected: "${filePath}" is outside the workspace`);
  }
  return abs;
}

import { join, relative } from "path";
import { readdirSync, statSync } from "fs";

export function walkDir(dir: string, root: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir) as unknown as string[];
  } catch {
    return results;
  }
  for (const entry of entries) {
    const abs = join(dir, entry);
    const rel = relative(root, abs);
    try {
      const stat = statSync(abs);
      if (stat.isDirectory()) {
        results.push(...walkDir(abs, root));
      } else {
        results.push(rel);
      }
    } catch {
      // skip unreadable
    }
  }
  return results;
}

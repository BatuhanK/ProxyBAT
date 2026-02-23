import { z } from "zod";
import { existsSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { safePath } from "./helpers/safePath";
import { defineTool } from "../toolFactory";

type FsListItem = {
  name: string;
  type: "dir" | "file" | "unknown";
  size: number | null;
  ext: string | null;
};

type FsListResult = {
  path: string;
  workspace: string;
  items: FsListItem[];
  count: number;
} | {
  error: string;
};

type FsListParams = {
  path: string;
};

/**
 * fs_list
 * List files and directories in the session workspace (or subdirectory).
 */
export function buildFsListDefinition(workspacePath: string) {
  const paramsSchema = z
    .object({
      path: z
        .string()
        .default(".")
        .describe(
          "Directory path relative to workspace root (default: workspace root)",
        ),
    })
    .describe("fs_list parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "List files and directories in the session workspace (or a subdirectory). Shows names, types, and sizes.",
    parameters: paramsSchema,
    execute: async (params: FsListParams): Promise<FsListResult> => {
      try {
        const abs = safePath(workspacePath, params.path);
        if (!existsSync(abs)) return { error: `Directory not found: ${params.path}` };
        const entries = readdirSync(abs) as unknown as string[];
        const items = entries.map((entry) => {
          const entryAbs = join(abs, entry);
          try {
            const stat = statSync(entryAbs);
            return {
              name: entry,
              type: stat.isDirectory() ? "dir" : "file",
              size: stat.isDirectory() ? null : stat.size,
              ext: stat.isDirectory() ? null : extname(entry),
            } as FsListItem;
          } catch {
            return { name: entry, type: "unknown", size: null, ext: null } as FsListItem;
          }
        });
        return {
          path: params.path,
          workspace: workspacePath,
          items,
          count: items.length,
        };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

import { defineTool } from "../toolFactory";
import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { safePath } from "./helpers/safePath";

/**
 * fs_read
 * Read a file from the session workspace. Returns line-numbered content.
 */
export function buildFsRead(workspacePath: string) {
  const paramsSchema = z
    .object({
      path: z.string().describe("File path relative to the session workspace"),
      offset: z
        .number()
        .int()
        .min(1)
        .default(1)
        .describe("Start line (1-indexed)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .default(200)
        .describe("Max lines to return"),
    })
    .describe("fs_read parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Read a file from the session workspace. Returns file content as text. Use offset and limit to read large files in chunks (line numbers).",
    parameters: paramsSchema,
    execute: async (params: FsReadParams) => {
      try {
        const abs = safePath(workspacePath, params.path);
        if (!existsSync(abs)) return { error: `File not found: ${params.path}` };
        const content = readFileSync(abs, "utf8");
        const lines = content.split("\n");
        const total = lines.length;
        const start = params.offset - 1;
        const slice = lines.slice(start, start + params.limit);
        const numbered = slice
          .map((l, i) => `${start + i + 1}: ${l}`)
          .join("\n");
        return {
          path: params.path,
          total_lines: total,
          returned_lines: slice.length,
          offset: params.offset,
          content: numbered,
        };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}
type FsReadParams = {
  path: string;
  offset: number;
  limit: number;
};

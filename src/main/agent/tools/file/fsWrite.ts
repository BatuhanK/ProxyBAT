import { z } from "zod";
import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import { safePath } from "./helpers/safePath";
import { defineTool } from "../toolFactory";

type FsWriteResult = {
  success: true;
  path: string;
  lines_written: number;
} | {
  error: string;
};

type FsWriteParams = {
  path: string;
  content: string;
};

/**
 * fs_write
 * Write (create or overwrite) a file in the session workspace.
 */
export function buildFsWriteDefinition(
  workspacePath: string,
  onFileWrite?: (path: string) => void,
) {
  const paramsSchema = z
    .object({
      path: z.string().describe("File path relative to the session workspace"),
      content: z.string().describe("Full file content to write"),
    })
    .describe("fs_write parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Write (create or overwrite) a file in the session workspace. Parent directories are created automatically.",
    parameters: paramsSchema,
    execute: async (params: FsWriteParams): Promise<FsWriteResult> => {
      try {
        const abs = safePath(workspacePath, params.path);
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, params.content, "utf8");
        const lines = params.content.split("\n").length;
        onFileWrite?.(params.path);
        return { success: true, path: params.path, lines_written: lines };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

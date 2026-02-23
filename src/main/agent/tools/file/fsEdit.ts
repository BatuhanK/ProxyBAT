import { z } from "zod";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { safePath } from "./helpers/safePath";
import { defineTool } from "../toolFactory";

type FsEditResult = {
  success: true;
  path: string;
} | {
  error: string;
};

type FsEditParams = {
  path: string;
  oldString: string;
  newString: string;
};

/**
 * fs_edit
 * Replace an exact string in a file with a new string. Requires unique match.
 */
export function buildFsEditDefinition(
  workspacePath: string,
  onFileWrite?: (path: string) => void,
) {
  const paramsSchema = z
    .object({
      path: z.string().describe("File path relative to the session workspace"),
      oldString: z.string().describe("Exact text to find and replace"),
      newString: z.string().describe("Replacement text"),
    })
    .describe("fs_edit parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Replace an exact string in a file with a new string. The oldString must match exactly (including indentation and newlines). Fails if oldString is not found or matches multiple times.",
    parameters: paramsSchema,
    execute: async (params: FsEditParams): Promise<FsEditResult> => {
      try {
        const abs = safePath(workspacePath, params.path);
        if (!existsSync(abs)) return { error: `File not found: ${params.path}` };
        const content = readFileSync(abs, "utf8");
        const count = content.split(params.oldString).length - 1;
        if (count === 0) return { error: "oldString not found in file" };
        if (count > 1)
          return { error: `oldString found ${count} times — provide more context to make it unique` };
        const updated = content.replace(params.oldString, params.newString);
        writeFileSync(abs, updated, "utf8");
        onFileWrite?.(params.path);
        return { success: true, path: params.path };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

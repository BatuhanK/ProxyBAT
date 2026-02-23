import { z } from "zod";
import { matchGlob } from "./helpers/matchGlob";
import { walkDir } from "./helpers/walkDir";
import { defineTool } from "../toolFactory";

type FsGlobResult = {
  pattern: string;
  matches: string[];
  count: number;
} | {
  error: string;
};

type FsGlobParams = {
  pattern: string;
};

/**
 * fs_glob
 * Find files in the session workspace matching a glob pattern.
 */
export function buildFsGlobDefinition(workspacePath: string) {
  const paramsSchema = z
    .object({
      pattern: z.string().describe("Glob pattern relative to workspace root"),
    })
    .describe("fs_glob parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Find files in the session workspace matching a glob pattern. Supports * (single segment) and ** (any depth). Example: \"**/*.py\", \"src/*.ts\".",
    parameters: paramsSchema,
    execute: async (params: FsGlobParams): Promise<FsGlobResult> => {
      try {
        const allFiles = walkDir(workspacePath, workspacePath);
        const matched = allFiles.filter((f) => matchGlob(params.pattern, f));
        return { pattern: params.pattern, matches: matched, count: matched.length };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

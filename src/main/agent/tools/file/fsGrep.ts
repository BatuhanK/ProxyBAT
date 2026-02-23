import { z } from "zod";
import { readFileSync } from "fs";
import { join } from "path";
import { matchGlob } from "./helpers/matchGlob";
import { walkDir } from "./helpers/walkDir";
import { defineTool } from "../toolFactory";

type FsGrepMatch = {
  file: string;
  line: number;
  text: string;
};

type FsGrepResult = {
  pattern: string;
  results: FsGrepMatch[];
  count: number;
} | {
  error: string;
};

type FsGrepParams = {
  pattern: string;
  include?: string;
  max_results: number;
};

/**
 * fs_grep
 * Search file contents using a regex pattern.
 */
export function buildFsGrepDefinition(workspacePath: string) {
  const paramsSchema = z
    .object({
      pattern: z.string().describe("Regex pattern to search for"),
      include: z
        .string()
        .optional()
        .describe("Glob pattern to filter which files to search (e.g. \"*.py\")"),
      max_results: z.number().int().min(1).max(200).default(50),
    })
    .describe("fs_grep parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Search file contents in the session workspace using a regex pattern. Returns matching file paths and line numbers.",
    parameters: paramsSchema,
    execute: async (params: FsGrepParams): Promise<FsGrepResult> => {
      try {
        const regex = new RegExp(params.pattern, "g");
        const allFiles = walkDir(workspacePath, workspacePath);
        const files = params.include
          ? allFiles.filter((f) => matchGlob(params.include!, f))
          : allFiles;
        const results: FsGrepMatch[] = [];

        for (const relPath of files) {
          if (results.length >= params.max_results) break;
          try {
            const abs = join(workspacePath, relPath);
            const content = readFileSync(abs, "utf8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length && results.length < params.max_results; i++) {
              if (regex.test(lines[i])) {
                results.push({
                  file: relPath,
                  line: i + 1,
                  text: lines[i].trim(),
                });
              }
              regex.lastIndex = 0;
            }
          } catch {
            // skip unreadable
          }
        }

        return { pattern: params.pattern, results, count: results.length };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

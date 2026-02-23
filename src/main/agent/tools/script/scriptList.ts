import { z } from "zod";
import { defineTool } from "../toolFactory";
import { ScriptStore } from "../../../storage/ScriptStore";

type ScriptListResult = {
  scripts: Array<{
    id: string;
    name: string;
    phase: "request" | "response" | "both";
    enabled: boolean;
    code_preview: string;
    created_at: string;
    updated_at: string;
  }>;
  count: number;
};

/**
 * script_list
 * List all mitmproxy intercept scripts with metadata and code preview.
 */
export function buildScriptListTool() {
  const paramsSchema = z
    .object({})
    .describe("script_list parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "List all mitmproxy intercept scripts. Shows id, name, phase, enabled status, and a preview of the code.",
    parameters: paramsSchema,
    execute: async (): Promise<ScriptListResult> => {
      const scripts = ScriptStore.getInstance().list();
      return {
        scripts: scripts.map((s) => ({
          id: s.id,
          name: s.name,
          phase: s.phase,
          enabled: s.enabled,
          code_preview: s.code.slice(0, 120) + (s.code.length > 120 ? "..." : ""),
          created_at: new Date(s.createdAt).toISOString(),
          updated_at: new Date(s.updatedAt).toISOString(),
        })),
        count: scripts.length,
      };
    },
  });
}

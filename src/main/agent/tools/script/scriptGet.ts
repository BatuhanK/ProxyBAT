import { z } from "zod";
import { defineTool } from "../toolFactory";
import { ScriptStore } from "../../../storage/ScriptStore";

type ScriptGetParams = {
  id: string;
};

type ScriptGetResult =
  | {
      id: string;
      name: string;
      phase: "request" | "response" | "both";
      enabled: boolean;
      code: string;
      created_at: string;
      updated_at: string;
    }
  | { error: string };

/**
 * script_get
 * Get the full code and metadata for a specific intercept script by ID.
 */
export function buildScriptGetTool() {
  const paramsSchema = z
    .object({
      id: z.string().describe("Script ID"),
    })
    .describe("script_get parameters") as z.ZodTypeAny;

  return defineTool({
    description: "Get the full code and metadata for a specific intercept script by ID.",
    parameters: paramsSchema,
    execute: async (params: ScriptGetParams): Promise<ScriptGetResult> => {
      const script = ScriptStore.getInstance().getById(params.id);
      if (!script) return { error: `Script ${params.id} not found` };
      return {
        id: script.id,
        name: script.name,
        phase: script.phase,
        enabled: script.enabled,
        code: script.code,
        created_at: new Date(script.createdAt).toISOString(),
        updated_at: new Date(script.updatedAt).toISOString(),
      };
    },
  });
}

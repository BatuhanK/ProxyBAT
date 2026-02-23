import { z } from "zod";
import { defineTool } from "../toolFactory";
import { ScriptStore } from "../../../storage/ScriptStore";
import { ProxyManager } from "../../../proxy/ProxyManager";

type ScriptUpdateParams = {
  id: string;
  name?: string;
  code?: string;
  phase?: "request" | "response" | "both";
  enabled?: boolean;
};

type ScriptUpdateResult =
  | {
      success: boolean;
      script: {
        id: string;
        name: string;
        code: string;
        phase: string;
        enabled: boolean;
        createdAt: number;
        updatedAt: number;
      } | null;
    }
  | { error: string };

const phaseEnum = z.enum(["request", "response", "both"]);

/**
 * script_update
 * Update an existing intercept script (name, code, phase, or enabled status).
 */
export function buildScriptUpdateTool() {
  const paramsSchema = z
    .object({
      id: z.string().describe("Script ID to update"),
      name: z.string().optional().describe("New name"),
      code: z.string().optional().describe("New Python code"),
      phase: phaseEnum.optional().describe("New phase"),
      enabled: z.boolean().optional().describe("Enable or disable the script"),
    })
    .describe("script_update parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Update an existing intercept script (name, code, phase, or enabled). Changes are pushed to the running proxy immediately.",
    parameters: paramsSchema,
    execute: async (params: ScriptUpdateParams): Promise<ScriptUpdateResult> => {
      try {
        const ok = ScriptStore.getInstance().update(params.id, {
          name: params.name,
          code: params.code,
          phase: params.phase,
          enabled: params.enabled,
        });
        if (!ok) return { error: `Script ${params.id} not found` };
        ProxyManager.getInstance().sendScripts();
        const updated = ScriptStore.getInstance().getById(params.id);
        return { success: true, script: updated };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

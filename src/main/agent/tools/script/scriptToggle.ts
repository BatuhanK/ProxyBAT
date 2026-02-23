import { z } from "zod";
import { defineTool } from "../toolFactory";
import { ScriptStore } from "../../../storage/ScriptStore";
import { ProxyManager } from "../../../proxy/ProxyManager";

type ScriptToggleParams = {
  id: string;
  enabled: boolean;
};

type ScriptToggleResult =
  | {
      success: boolean;
      id: string;
      enabled: boolean;
    }
  | { error: string };

/**
 * script_toggle
 * Enable or disable an intercept script by ID.
 */
export function buildScriptToggleTool() {
  const paramsSchema = z
    .object({
      id: z.string().describe("Script ID"),
      enabled: z.boolean().describe("true to enable, false to disable"),
    })
    .describe("script_toggle parameters") as z.ZodTypeAny;

  return defineTool({
    description: "Enable or disable an intercept script by ID.",
    parameters: paramsSchema,
    execute: async (params: ScriptToggleParams): Promise<ScriptToggleResult> => {
      try {
        const ok = ScriptStore.getInstance().update(params.id, { enabled: params.enabled });
        if (!ok) return { error: `Script ${params.id} not found` };
        ProxyManager.getInstance().sendScripts();
        return { success: true, id: params.id, enabled: params.enabled };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

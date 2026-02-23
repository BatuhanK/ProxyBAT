import { z } from "zod";
import { defineTool } from "../toolFactory";
import { ScriptStore } from "../../../storage/ScriptStore";
import { ProxyManager } from "../../../proxy/ProxyManager";

type ScriptDeleteParams = {
  id: string;
};

type ScriptDeleteResult =
  | {
      success: boolean;
      id: string;
    }
  | { error: string };

/**
 * script_delete
 * Delete an intercept script by ID.
 */
export function buildScriptDeleteTool() {
  const paramsSchema = z
    .object({
      id: z.string().describe("Script ID to delete"),
    })
    .describe("script_delete parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Delete an intercept script by ID. The change is pushed to the running proxy immediately.",
    parameters: paramsSchema,
    execute: async (params: ScriptDeleteParams): Promise<ScriptDeleteResult> => {
      try {
        const ok = ScriptStore.getInstance().delete(params.id);
        if (!ok) return { error: `Script ${params.id} not found` };
        ProxyManager.getInstance().sendScripts();
        return { success: true, id: params.id };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

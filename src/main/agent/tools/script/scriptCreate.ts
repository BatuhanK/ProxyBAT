import { z } from "zod";
import { defineTool } from "../toolFactory";
import { ScriptStore } from "../../../storage/ScriptStore";
import { ProxyManager } from "../../../proxy/ProxyManager";

type ScriptCreateParams = {
  name: string;
  code: string;
  phase: "request" | "response" | "both";
  enabled: boolean;
};

type ScriptCreateResult =
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
      };
    }
  | { error: string };

const phaseEnum = z.enum(["request", "response", "both"]);

/**
 * script_create
 * Create a new mitmproxy intercept script with Python code.
 */
export function buildScriptCreateTool() {
  const paramsSchema = z
    .object({
      name: z.string().describe("Human-readable name for the script"),
      code: z.string().describe("Python code to execute in the mitmproxy hook"),
      phase: phaseEnum
        .default("both")
        .describe('Which hook to run in: "request", "response", or "both"'),
      enabled: z.boolean().default(true).describe("Whether the script is active immediately"),
    })
    .describe("script_create parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      'Create a new mitmproxy intercept script. The script is Python code executed inside mitmproxy hooks. The `flow` object (mitmproxy HTTPFlow) is available in scope. The script is automatically pushed to the running proxy.',
    parameters: paramsSchema,
    execute: async (params: ScriptCreateParams): Promise<ScriptCreateResult> => {
      try {
        const script = ScriptStore.getInstance().create({
          name: params.name,
          code: params.code,
          phase: params.phase,
          enabled: params.enabled,
        });
        if (params.enabled) ProxyManager.getInstance().sendScripts();
        return { success: true, script };
      } catch (err) {
        return { error: String(err) };
      }
    },
  });
}

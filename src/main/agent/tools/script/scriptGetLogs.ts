import { z } from "zod";
import { defineTool } from "../toolFactory";
import { ProxyManager } from "../../../proxy/ProxyManager";

type ScriptGetLogsParams = {
  script?: string;
  level?: "debug" | "info" | "warn" | "error" | "alert";
  limit: number;
};

type ScriptGetLogsResult = {
  count: number;
  logs: Array<{
    script: string;
    level: string;
    message: string;
    timestamp: string;
  }>;
};

/**
 * script_get_logs
 * Read recent output and runtime errors from running intercept scripts.
 */
export function buildScriptGetLogsTool() {
  const paramsSchema = z
    .object({
      script: z.string().optional().describe("Filter to a specific script name."),
      level: z
        .enum(["debug", "info", "warn", "error", "alert"])
        .optional()
        .describe("Filter by log level."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(50)
        .describe("Maximum number of log entries to return (default 50, max 200)."),
    })
    .describe("script_get_logs parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Read recent ctx.log.* output and runtime errors from running intercept scripts. Use this after installing or updating a script to verify it is working correctly.",
    parameters: paramsSchema,
    execute: async (params: ScriptGetLogsParams): Promise<ScriptGetLogsResult> => {
      const logs = ProxyManager.getInstance().getScriptLogs({
        script: params.script,
        level: params.level,
        limit: params.limit,
      });
      return {
        count: logs.length,
        logs: logs.map((e) => ({
          script: e.script,
          level: e.level,
          message: e.message,
          timestamp: new Date(e.timestamp).toISOString(),
        })),
      };
    },
  });
}

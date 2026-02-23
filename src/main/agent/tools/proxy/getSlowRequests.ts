import { z } from "zod";
import { defineTool } from "../toolFactory";
import { Database } from "../../../storage/Database";
import { getSessionIdOrDefault } from "./helpers";

type GetSlowRequestsParams = {
  threshold_ms: number;
  session_id?: string;
  limit: number;
};

type GetSlowRequestsResult =
  | {
      threshold_ms: number;
      requests: Array<{
        id: string;
        method: string;
        url: string;
        host: string;
        status_code: number | null;
        duration_ms: number;
        timestamp: string;
        content_type: string | null;
      }>;
    }
  | { error: string };

/**
 * get_slow_requests
 * Find the slowest HTTP requests in a session above a given duration threshold.
 */
export function buildGetSlowRequestsTool(defaultSessionId?: string) {
  const paramsSchema = z
    .object({
      threshold_ms: z
        .number()
        .int()
        .min(0)
        .default(1000)
        .describe("Minimum duration in milliseconds"),
      session_id: z
        .string()
        .optional()
        .describe("Session ID (defaults to most recent)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Max results"),
    })
    .describe("get_slow_requests parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Find the slowest HTTP requests in a session above a given duration threshold.",
    parameters: paramsSchema,
    execute: async (params: GetSlowRequestsParams): Promise<GetSlowRequestsResult> => {
      const session = getSessionIdOrDefault(params.session_id ?? defaultSessionId);
      if ("error" in session) return { error: session.error };
      const rows = Database.getInstance()
        .getDb()
        .prepare(
          `SELECT id, method, url, host, status_code, duration_ms, timestamp, content_type
           FROM requests
           WHERE session_id = ? AND duration_ms >= ?
           ORDER BY duration_ms DESC LIMIT ?`,
        )
        .all(session.sessionId, params.threshold_ms, params.limit) as Array<{
        id: string;
        method: string;
        url: string;
        host: string;
        status_code: number | null;
        duration_ms: number;
        timestamp: number;
        content_type: string | null;
      }>;
      return {
        threshold_ms: params.threshold_ms,
        requests: rows.map((r) => ({
          ...r,
          timestamp: new Date(r.timestamp).toISOString(),
        })),
      };
    },
  });
}

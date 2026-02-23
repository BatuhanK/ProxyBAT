import { z } from "zod";
import { defineTool } from "../toolFactory";
import { Database } from "../../../storage/Database";
import { getSessionIdOrDefault } from "./helpers";

type GetErrorRequestsParams = {
  session_id?: string;
  status_category: "4xx" | "5xx" | "all";
  limit: number;
};

type GetErrorRequestsResult =
  | {
      error_requests: Array<{
        id: string;
        method: string;
        url: string;
        host: string;
        status_code: number | null;
        duration_ms: number | null;
        timestamp: string;
        content_type: string | null;
      }>;
      count: number;
    }
  | { error: string };

/**
 * get_error_requests
 * Get all failed requests (4xx and 5xx status codes) from a session.
 */
export function buildGetErrorRequestsTool(defaultSessionId?: string) {
  const paramsSchema = z
    .object({
      session_id: z
        .string()
        .optional()
        .describe("Session ID (defaults to most recent)"),
      status_category: z
        .enum(["4xx", "5xx", "all"])
        .default("all")
        .describe("Which error category to return"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(50)
        .describe("Max results"),
    })
    .describe("get_error_requests parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Get all failed requests (4xx and 5xx status codes) from a session.",
    parameters: paramsSchema,
    execute: async (params: GetErrorRequestsParams): Promise<GetErrorRequestsResult> => {
      const session = getSessionIdOrDefault(params.session_id ?? defaultSessionId);
      if ("error" in session) return { error: session.error };
      let minStatus = 400,
        maxStatus = 599;
      if (params.status_category === "4xx") {
        minStatus = 400;
        maxStatus = 499;
      }
      if (params.status_category === "5xx") {
        minStatus = 500;
        maxStatus = 599;
      }
      const rows = Database.getInstance()
        .getDb()
        .prepare(
          `SELECT id, method, url, host, status_code, duration_ms, timestamp, content_type
           FROM requests
           WHERE session_id = ? AND status_code >= ? AND status_code <= ?
           ORDER BY timestamp DESC LIMIT ?`,
        )
        .all(session.sessionId, minStatus, maxStatus, params.limit) as Array<{
        id: string;
        method: string;
        url: string;
        host: string;
        status_code: number | null;
        duration_ms: number | null;
        timestamp: number;
        content_type: string | null;
      }>;
      return {
        error_requests: rows.map((r) => ({
          ...r,
          timestamp: new Date(r.timestamp).toISOString(),
        })),
        count: rows.length,
      };
    },
  });
}

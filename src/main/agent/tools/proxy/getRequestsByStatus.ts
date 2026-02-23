import { z } from "zod";
import { defineTool } from "../toolFactory";
import { RequestStore } from "../../../storage/RequestStore";
import { getSessionIdOrDefault } from "./helpers";

type GetRequestsByStatusParams = {
  status_code: number;
  session_id?: string;
  limit: number;
};

type GetRequestsByStatusResult =
  | {
      status_code: number;
      total: number;
      requests: Array<{
        id: string;
        method: string;
        url: string;
        host: string;
        duration_ms: number | null;
        content_type: string | null;
        timestamp: string;
      }>;
    }
  | { error: string };

/**
 * get_requests_by_status
 * Get all requests with a specific HTTP status code.
 */
export function buildGetRequestsByStatusTool(defaultSessionId?: string) {
  const paramsSchema = z
    .object({
      status_code: z
        .number()
        .int()
        .min(100)
        .max(599)
        .describe("HTTP status code (e.g. 200, 404, 500)"),
      session_id: z
        .string()
        .optional()
        .describe("Session ID (defaults to most recent)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(50)
        .describe("Max results"),
    })
    .describe("get_requests_by_status parameters") as z.ZodTypeAny;

  return defineTool({
    description: "Get all requests with a specific HTTP status code.",
    parameters: paramsSchema,
    execute: async (
      params: GetRequestsByStatusParams,
    ): Promise<GetRequestsByStatusResult> => {
      const session = getSessionIdOrDefault(params.session_id ?? defaultSessionId);
      if ("error" in session) return { error: session.error };
      const { requests, total } = RequestStore.getInstance().list({
        sessionId: session.sessionId,
        statusCode: params.status_code,
        limit: params.limit,
      });
      return {
        status_code: params.status_code,
        total,
        requests: requests.map((r) => ({
          id: r.id,
          method: r.method,
          url: r.url,
          host: r.host,
          duration_ms: r.durationMs,
          content_type: r.contentType,
          timestamp: new Date(r.timestamp).toISOString(),
        })),
      };
    },
  });
}

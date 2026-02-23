import { z } from "zod";
import { defineTool } from "../toolFactory";
import { RequestStore } from "../../../storage/RequestStore";
import { getSessionIdOrDefault } from "./helpers";

type SearchRequestsParams = {
  query: string;
  session_id?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  status_category?: "2xx" | "3xx" | "4xx" | "5xx";
  limit: number;
  offset: number;
};

type SearchRequestsResult =
  | {
      results: Array<{
        id: string;
        method: string;
        url: string;
        status: number | null;
        duration_ms: number | null;
        content_type: string | null;
        timestamp: string;
        ssl_intercepted: boolean;
      }>;
      total: number;
      returned: number;
    }
  | { error: string };

/**
 * search_requests
 * Search HTTP requests by URL, host, method, status category, or body content.
 */
export function buildSearchRequestsTool(defaultSessionId?: string) {
  const paramsSchema = z
    .object({
      query: z.string().describe("Text to search for in URL, host, path"),
      session_id: z
        .string()
        .optional()
        .describe("Limit search to a specific proxy session ID"),
      method: z
        .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
        .optional()
        .describe("Filter by HTTP method"),
      status_category: z
        .enum(["2xx", "3xx", "4xx", "5xx"])
        .optional()
        .describe("Filter by status code category"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(50)
        .describe("Max results to return"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
    })
    .describe("search_requests parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Search through HTTP requests and responses by URL, host, method, status code, or body content. Returns matching requests with their metadata.",
    parameters: paramsSchema,
    execute: async (params: SearchRequestsParams): Promise<SearchRequestsResult> => {
      const session = getSessionIdOrDefault(params.session_id ?? defaultSessionId);
      if ("error" in session) return { error: session.error };
      const { requests, total } = RequestStore.getInstance().list({
        sessionId: session.sessionId,
        search: params.query,
        method: params.method,
        statusCategory: params.status_category,
        limit: params.limit,
        offset: params.offset,
      });
      const results = requests.map((r) => ({
        id: r.id,
        method: r.method,
        url: r.url,
        status: r.statusCode,
        duration_ms: r.durationMs,
        content_type: r.contentType,
        timestamp: new Date(r.timestamp).toISOString(),
        ssl_intercepted: r.sslIntercepted,
      }));
      return { results, total, returned: results.length };
    },
  });
}

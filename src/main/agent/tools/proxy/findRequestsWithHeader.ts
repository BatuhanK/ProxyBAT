import { z } from "zod";
import { defineTool } from "../toolFactory";
import { Database } from "../../../storage/Database";
import { getSessionIdOrDefault } from "./helpers";

type FindRequestsWithHeaderParams = {
  header_name: string;
  header_value?: string;
  session_id?: string;
  limit: number;
};

type FindRequestsWithHeaderResult =
  | {
      header: string;
      matches: Array<{
        id: string;
        method: string;
        url: string;
        host: string;
        status_code: number | null;
        timestamp: string;
      }>;
    }
  | { error: string };

/**
 * find_requests_with_header
 * Find requests that contain a specific header name, optionally filtering by value.
 */
export function buildFindRequestsWithHeaderTool(defaultSessionId?: string) {
  const paramsSchema = z
    .object({
      header_name: z
        .string()
        .describe("Header name to search for (case-insensitive)"),
      header_value: z
        .string()
        .optional()
        .describe("Optional header value to match (partial match)"),
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
    .describe("find_requests_with_header parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Find requests that contain a specific header name, optionally filtering by value.",
    parameters: paramsSchema,
    execute: async (
      params: FindRequestsWithHeaderParams,
    ): Promise<FindRequestsWithHeaderResult> => {
      const session = getSessionIdOrDefault(params.session_id ?? defaultSessionId);
      if ("error" in session) return { error: session.error };
      const rows = Database.getInstance()
        .getDb()
        .prepare(
          `SELECT id, method, url, host, status_code, request_headers, response_headers, timestamp
           FROM requests WHERE session_id = ? ORDER BY timestamp DESC`,
        )
        .all(session.sessionId) as Array<{
        id: string;
        method: string;
        url: string;
        host: string;
        status_code: number | null;
        request_headers: string;
        response_headers: string;
        timestamp: number;
      }>;
      const headerLower = params.header_name.toLowerCase();
      const valueLower = params.header_value?.toLowerCase();
      const matched = rows
        .filter((row) => {
          const allHeaders = {
            ...JSON.parse(row.request_headers || "{}"),
            ...JSON.parse(row.response_headers || "{}"),
          };
          for (const [k, v] of Object.entries(
            allHeaders as Record<string, string>,
          )) {
            if (k.toLowerCase().includes(headerLower)) {
              if (!valueLower || v.toLowerCase().includes(valueLower))
                return true;
            }
          }
          return false;
        })
        .slice(0, params.limit)
        .map((r) => ({
          id: r.id,
          method: r.method,
          url: r.url,
          host: r.host,
          status_code: r.status_code,
          timestamp: new Date(r.timestamp).toISOString(),
        }));
      return { header: params.header_name, matches: matched };
    },
  });
}

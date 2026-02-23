import { z } from "zod";
import { defineTool } from "../toolFactory";
import { RequestStore } from "../../../storage/RequestStore";

type CompareRequestsParams = {
  request_id_a: string;
  request_id_b: string;
};

type CompareRequestsResult =
  | {
      a: {
        id: string;
        method: string;
        url: string;
        status: number | null;
        duration_ms: number | null;
        timestamp: string;
      };
      b: {
        id: string;
        method: string;
        url: string;
        status: number | null;
        duration_ms: number | null;
        timestamp: string;
      };
      differences: {
        method: { a: string; b: string } | null;
        url: { a: string; b: string } | null;
        status_code: { a: number | null; b: number | null } | null;
        duration_ms: { a: number | null; b: number | null } | null;
        request_header_diffs: Record<string, { a?: string; b?: string }>;
        response_header_diffs: Record<string, { a?: string; b?: string }>;
      };
    }
  | { error: string };

/**
 * compare_requests
 * Compare two requests side by side showing differences in headers, status codes, and metadata.
 */
export function buildCompareRequestsTool() {
  const paramsSchema = z
    .object({
      request_id_a: z.string().describe("First request ID"),
      request_id_b: z.string().describe("Second request ID"),
    })
    .describe("compare_requests parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Compare two requests side by side: show differences in headers, status codes, and metadata.",
    parameters: paramsSchema,
    execute: async (params: CompareRequestsParams): Promise<CompareRequestsResult> => {
      const a = RequestStore.getInstance().getById(params.request_id_a);
      const b = RequestStore.getInstance().getById(params.request_id_b);
      if (!a) return { error: `Request A (${params.request_id_a}) not found` };
      if (!b) return { error: `Request B (${params.request_id_b}) not found` };
      const reqHeaderDiffs: Record<string, { a?: string; b?: string }> = {};
      for (const key of new Set([
        ...Object.keys(a.requestHeaders),
        ...Object.keys(b.requestHeaders),
      ])) {
        if (a.requestHeaders[key] !== b.requestHeaders[key]) {
          reqHeaderDiffs[key] = {
            a: a.requestHeaders[key],
            b: b.requestHeaders[key],
          };
        }
      }
      const resHeaderDiffs: Record<string, { a?: string; b?: string }> = {};
      for (const key of new Set([
        ...Object.keys(a.responseHeaders),
        ...Object.keys(b.responseHeaders),
      ])) {
        if (a.responseHeaders[key] !== b.responseHeaders[key]) {
          resHeaderDiffs[key] = {
            a: a.responseHeaders[key],
            b: b.responseHeaders[key],
          };
        }
      }
      return {
        a: {
          id: a.id,
          method: a.method,
          url: a.url,
          status: a.statusCode,
          duration_ms: a.durationMs,
          timestamp: new Date(a.timestamp).toISOString(),
        },
        b: {
          id: b.id,
          method: b.method,
          url: b.url,
          status: b.statusCode,
          duration_ms: b.durationMs,
          timestamp: new Date(b.timestamp).toISOString(),
        },
        differences: {
          method: a.method !== b.method ? { a: a.method, b: b.method } : null,
          url: a.url !== b.url ? { a: a.url, b: b.url } : null,
          status_code:
            a.statusCode !== b.statusCode
              ? { a: a.statusCode, b: b.statusCode }
              : null,
          duration_ms:
            a.durationMs !== b.durationMs
              ? { a: a.durationMs, b: b.durationMs }
              : null,
          request_header_diffs: reqHeaderDiffs,
          response_header_diffs: resHeaderDiffs,
        },
      };
    },
  });
}

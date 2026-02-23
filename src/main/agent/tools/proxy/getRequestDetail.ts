import { z } from "zod";
import { defineTool } from "../toolFactory";
import { RequestStore } from "../../../storage/RequestStore";

type GetRequestDetailParams = {
  request_id: string;
};

type GetRequestDetailResult =
  | {
      id: string;
      session_id: string;
      method: string;
      url: string;
      host: string;
      path: string;
      status_code: number | null;
      duration_ms: number | null;
      content_type: string | null;
      ssl_intercepted: boolean;
      timestamp: string;
      request_headers: Record<string, string>;
      response_headers: Record<string, string>;
      has_request_body: boolean;
      has_response_body: boolean;
    }
  | { error: string };

/**
 * get_request_detail
 * Get complete details for a single request including all headers and metadata.
 */
export function buildGetRequestDetailTool() {
  const paramsSchema = z
    .object({
      request_id: z.string().describe("The request ID to fetch details for"),
    })
    .describe("get_request_detail parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Get full details for a single request including all headers, metadata, and body presence info.",
    parameters: paramsSchema,
    execute: async (params: GetRequestDetailParams): Promise<GetRequestDetailResult> => {
      const request = RequestStore.getInstance().getById(params.request_id);
      if (!request) return { error: `Request ${params.request_id} not found` };
      return {
        id: request.id,
        session_id: request.sessionId,
        method: request.method,
        url: request.url,
        host: request.host,
        path: request.path,
        status_code: request.statusCode,
        duration_ms: request.durationMs,
        content_type: request.contentType,
        ssl_intercepted: request.sslIntercepted,
        timestamp: new Date(request.timestamp).toISOString(),
        request_headers: request.requestHeaders,
        response_headers: request.responseHeaders,
        has_request_body: !!request.requestBodyKey,
        has_response_body: !!request.responseBodyKey,
      };
    },
  });
}

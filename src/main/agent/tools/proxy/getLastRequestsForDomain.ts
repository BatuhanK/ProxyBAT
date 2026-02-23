import { z } from "zod";
import { defineTool } from "../toolFactory";
import {
  ASSET_TYPES,
  classifyResourceType,
  type ResourceType,
} from "@shared/resourceType";
import { RequestStore } from "../../../storage/RequestStore";
import { getSessionIdOrDefault } from "./helpers";

type GetLastRequestsForDomainParams = {
  domain: string;
  session_id?: string;
  limit: number;
  include_headers: boolean;
  exclude_assets: boolean;
  resource_types?: Array<
    | "document"
    | "xhr"
    | "script"
    | "stylesheet"
    | "image"
    | "font"
    | "media"
    | "websocket"
    | "other"
  >;
};

type GetLastRequestsForDomainResult =
  | {
      domain: string;
      total_before_filter: number;
      returned: number;
      requests: Array<
        | {
            id: string;
            method: string;
            url: string;
            path: string;
            status: number | null;
            duration_ms: number | null;
            content_type: string | null;
            resource_type: ResourceType;
            timestamp: string;
            has_request_body: boolean;
            has_response_body: boolean;
          }
        | {
            id: string;
            method: string;
            url: string;
            path: string;
            status: number | null;
            duration_ms: number | null;
            content_type: string | null;
            resource_type: ResourceType;
            timestamp: string;
            has_request_body: boolean;
            has_response_body: boolean;
            request_headers: Record<string, string>;
            response_headers: Record<string, string>;
          }
      >;
    }
  | { error: string };

/**
 * get_last_requests_for_domain
 * Return the most recent requests for a domain, optionally filtering assets.
 */
export function buildGetLastRequestsForDomainTool(defaultSessionId?: string) {
  const paramsSchema = z
    .object({
      domain: z
        .string()
        .describe('Domain/host to filter by (e.g. "api.example.com")'),
      session_id: z
        .string()
        .optional()
        .describe("Limit to specific proxy session"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(20)
        .describe("Number of requests to return"),
      include_headers: z
        .boolean()
        .default(false)
        .describe("Include request and response headers in output"),
      exclude_assets: z
        .boolean()
        .default(true)
        .describe(
          "Exclude static asset requests (scripts, stylesheets, images, fonts, media). Default true — set to false to include all resource types.",
        ),
      resource_types: z
        .array(
          z.enum([
            "document",
            "xhr",
            "script",
            "stylesheet",
            "image",
            "font",
            "media",
            "websocket",
            "other",
          ]),
        )
        .optional()
        .describe(
          "Allowlist of resource types to include. If set, overrides exclude_assets. E.g. ['xhr', 'document'] to see only data requests.",
        ),
    })
    .describe("get_last_requests_for_domain parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Get the most recent HTTP requests for a specific domain or host. By default excludes static assets (scripts, stylesheets, images, fonts, media) to focus on data requests.",
    parameters: paramsSchema,
    execute: async (
      params: GetLastRequestsForDomainParams,
    ): Promise<GetLastRequestsForDomainResult> => {
      const session = getSessionIdOrDefault(params.session_id ?? defaultSessionId);
      if ("error" in session) return { error: session.error };

      const fetchLimit =
        params.resource_types || params.exclude_assets
          ? Math.min(params.limit * 10, 500)
          : params.limit;

      const { requests, total } = RequestStore.getInstance().list({
        sessionId: session.sessionId,
        host: params.domain,
        limit: fetchLimit,
      });

      const filtered = requests
        .filter((r) => {
          const rt = classifyResourceType(r.contentType, r.url) as ResourceType;
          if (params.resource_types && params.resource_types.length > 0) {
            return params.resource_types.includes(rt);
          }
          if (params.exclude_assets) return !ASSET_TYPES.includes(rt);
          return true;
        })
        .slice(0, params.limit);

      const results = filtered.map((r) => {
        const rt = classifyResourceType(r.contentType, r.url) as ResourceType;
        const base = {
          id: r.id,
          method: r.method,
          url: r.url,
          path: r.path,
          status: r.statusCode,
          duration_ms: r.durationMs,
          content_type: r.contentType,
          resource_type: rt,
          timestamp: new Date(r.timestamp).toISOString(),
          has_request_body: !!r.requestBodyKey,
          has_response_body: !!r.responseBodyKey,
        };
        if (params.include_headers) {
          return {
            ...base,
            request_headers: r.requestHeaders,
            response_headers: r.responseHeaders,
          };
        }
        return base;
      });

      return {
        domain: params.domain,
        total_before_filter: total,
        returned: results.length,
        requests: results,
      };
    },
  });
}

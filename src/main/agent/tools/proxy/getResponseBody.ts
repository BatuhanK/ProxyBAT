import { z } from "zod";
import { defineTool } from "../toolFactory";
import { BodyStore } from "../../../storage/BodyStore";
import { RequestStore } from "../../../storage/RequestStore";

type GetResponseBodyParams = {
  request_id: string;
  offset: number;
  limit: number;
};

type GetResponseBodyResult =
  | {
      request_id: string;
      url: string;
      status: number | null;
      content_type: string | null;
      total_bytes: number;
      offset: number;
      returned_bytes: number;
      body: string;
    }
  | { error: string };

/**
 * get_response_body
 * Get the response body for a specific request (partial reads supported).
 */
export function buildGetResponseBodyTool() {
  const paramsSchema = z
    .object({
      request_id: z.string().describe("The request ID"),
      offset: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Byte offset to start reading from"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50_000)
        .describe("Max bytes to return"),
    })
    .describe("get_response_body parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Get the response body for a specific request. Supports partial reads with offset/limit for large responses.",
    parameters: paramsSchema,
    execute: async (params: GetResponseBodyParams): Promise<GetResponseBodyResult> => {
      const request = RequestStore.getInstance().getById(params.request_id);
      if (!request) return { error: `Request ${params.request_id} not found` };
      if (!request.responseBodyKey) {
        return { error: "No response body stored for this request" };
      }
      const { data, totalBytes } = await BodyStore.getInstance().get(
        request.responseBodyKey,
        params.offset,
        params.limit,
      );
      return {
        request_id: params.request_id,
        url: request.url,
        status: request.statusCode,
        content_type: request.contentType,
        total_bytes: totalBytes,
        offset: params.offset,
        returned_bytes: data.length,
        body: data.toString("utf8"),
      };
    },
  });
}

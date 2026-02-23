import { z } from "zod";
import { defineTool } from "../toolFactory";
import { BodyStore } from "../../../storage/BodyStore";
import { RequestStore } from "../../../storage/RequestStore";

type GetRequestBodyParams = {
  request_id: string;
  offset: number;
  limit?: number;
};

type GetRequestBodyResult =
  | {
      request_id: string;
      method: string;
      url: string;
      total_bytes: number;
      offset: number;
      returned_bytes: number;
      body: string;
    }
  | { error: string };

/**
 * get_request_body
 * Get the request payload for a specific request (partial reads supported).
 */
export function buildGetRequestBodyTool() {
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
        .max(100000)
        .optional()
        .describe("Max bytes to return"),
    })
    .describe("get_request_body parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Get the request body (payload) for a specific request. Supports partial reads with offset/limit.",
    parameters: paramsSchema,
    execute: async (params: GetRequestBodyParams): Promise<GetRequestBodyResult> => {
      const request = RequestStore.getInstance().getById(params.request_id);
      if (!request) return { error: `Request ${params.request_id} not found` };
      if (!request.requestBodyKey) {
        return { error: "No request body stored for this request" };
      }
      const { data, totalBytes } = await BodyStore.getInstance().get(
        request.requestBodyKey,
        params.offset,
        params.limit,
      );
      return {
        request_id: params.request_id,
        method: request.method,
        url: request.url,
        total_bytes: totalBytes,
        offset: params.offset,
        returned_bytes: data.length,
        body: data.toString("utf8"),
      };
    },
  });
}

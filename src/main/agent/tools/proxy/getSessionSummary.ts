import { z } from "zod";
import { defineTool } from "../toolFactory";
import { RequestStore } from "../../../storage/RequestStore";
import { getSessionIdOrDefault } from "./helpers";
import type { SessionSummary } from "@shared/types";

type GetSessionSummaryParams = {
  session_id?: string;
};

type GetSessionSummaryResult = SessionSummary | { error: string };

/**
 * get_session_summary
 * Get a summary of a proxy session with request counts, domains, status breakdown, etc.
 */
export function buildGetSessionSummaryTool(defaultSessionId?: string) {
  const paramsSchema = z
    .object({
      session_id: z
        .string()
        .optional()
        .describe("Session ID (defaults to the most recent session)"),
    })
    .describe("get_session_summary parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "Get a summary of a proxy session including total requests, domains visited, status code breakdown, average response time, and error count.",
    parameters: paramsSchema,
    execute: async (params: GetSessionSummaryParams): Promise<GetSessionSummaryResult> => {
      const session = getSessionIdOrDefault(params.session_id ?? defaultSessionId);
      if ("error" in session) return { error: session.error };
      const summary = RequestStore.getInstance().getSessionSummary(session.sessionId);
      if (!summary) return { error: `Session ${session.sessionId} not found` };
      return summary;
    },
  });
}

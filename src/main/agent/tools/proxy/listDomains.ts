import { z } from "zod";
import { defineTool } from "../toolFactory";
import { Database } from "../../../storage/Database";
import { getSessionIdOrDefault } from "./helpers";

type ListDomainsParams = {
  session_id?: string;
};

type ListDomainsResult =
  | {
      session_id: string;
      domains: Array<{
        host: string;
        count: number;
      }>;
    }
  | { error: string };

/**
 * list_domains
 * List all unique domains/hosts seen in a proxy session with request counts.
 */
export function buildListDomainsTool(defaultSessionId?: string) {
  const paramsSchema = z
    .object({
      session_id: z
        .string()
        .optional()
        .describe("Session ID (defaults to most recent session)"),
    })
    .describe("list_domains parameters") as z.ZodTypeAny;

  return defineTool({
    description:
      "List all unique domains/hosts seen in a proxy session with request counts.",
    parameters: paramsSchema,
    execute: async (params: ListDomainsParams): Promise<ListDomainsResult> => {
      const session = getSessionIdOrDefault(params.session_id ?? defaultSessionId);
      if ("error" in session) return { error: session.error };
      const rows = Database.getInstance()
        .getDb()
        .prepare(
          `SELECT host, COUNT(*) as count FROM requests WHERE session_id = ?
           GROUP BY host ORDER BY count DESC`,
        )
        .all(session.sessionId) as Array<{ host: string; count: number }>;
      return { session_id: session.sessionId, domains: rows };
    },
  });
}

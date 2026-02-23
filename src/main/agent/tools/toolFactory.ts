import { tool } from "ai";
import type { ZodSchema } from "zod";
import type { z } from "zod";

/**
 * Tool definition that matches the ai SDK's tool function signature.
 * Uses `parameters` instead of `inputSchema` for our API consistency.
 */
interface ToolDefinition<TParams extends ZodSchema = ZodSchema, TResult = unknown> {
  description: string;
  parameters: TParams;
  execute: (params: z.infer<TParams>) => Promise<TResult>;
}

/**
 * Wrapper for ai SDK's tool function with improved typing.
 * The ai SDK expects `inputSchema` but we use `parameters` for consistency.
 * Returns a strongly-typed tool object from the ai library.
 *
 * @param definition Tool definition with description, parameters schema, and execute function
 * @returns A tool object compatible with the ai SDK
 *
 * @example
 * ```ts
 * const myTool = defineTool({
 *   description: "Do something",
 *   parameters: z.object({ id: z.string() }),
 *   execute: async (params) => ({ success: true })
 * })
 * ```
 */
export function defineTool<TParams extends ZodSchema, TResult = unknown>(
  definition: ToolDefinition<TParams, TResult>,
): ReturnType<typeof tool> {
  // Cast to bypass ai SDK's strict inputSchema requirement while keeping our parameter naming
  const toolDef = {
    description: definition.description,
    inputSchema: definition.parameters,
    execute: definition.execute,
  };
  // Use unknown cast to bypass strict type checking - the ai SDK will accept this at runtime
  return tool(toolDef as unknown as Parameters<typeof tool>[0]);
}

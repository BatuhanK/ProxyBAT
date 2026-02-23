import { z } from 'zod'
import { defineTool } from '../toolFactory'

/**
 * Create Test Session Tool
 * Register a named label for a test session. Call this before starting a series of active tests
 * (replays, fuzzing) so you can reference the session by name in your security report.
 * The name will appear in your analysis notes.
 */

type Params = z.infer<typeof paramsSchema>

const paramsSchema = z.object({
  session_name: z
    .string()
    .min(1)
    .max(80)
    .describe(
      'A descriptive name for this test session (e.g. "IDOR-test-user-endpoint", "SQLi-login-form")',
    ),
  description: z
    .string()
    .optional()
    .describe('Optional description of what this test session covers'),
})

type Result = {
  session_name: string
  description: string | null
  created_at: string
  note: string
}

async function execute(params: Params): Promise<Result> {
  return {
    session_name: params.session_name,
    description: params.description ?? null,
    created_at: new Date().toISOString(),
    note: 'Test traffic sent through the proxy will be captured in the main Traffic tab. Reference this session name in your security_report.md.',
  }
}

export const createTestSession = defineTool({
  description:
    'Register a named label for a test session. Call this before starting a series of active tests ' +
    '(replays, fuzzing) so you can reference the session by name in your security report. ' +
    'The name will appear in your analysis notes.',
  parameters: paramsSchema,
  execute,
})

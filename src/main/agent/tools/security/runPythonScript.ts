import { execFile } from 'child_process'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
import { promisify } from 'util'
import { z } from 'zod'
import { defineTool } from '../toolFactory'

const execFileAsync = promisify(execFile)

/**
 * Run Python Script Tool
 * Execute a Python script from the session workspace.
 * Only .py files inside the workspace folder are allowed.
 * Returns stdout, stderr, and exit code. Timeout: 30 seconds.
 */

type Params = z.infer<typeof paramsSchema>

const paramsSchema = z.object({
  filename: z
    .string()
    .describe(
      'Path to the .py file relative to the workspace root (e.g. "poc_idor.py" or "poc/poc_sqli.py")',
    ),
  args: z
    .array(z.string())
    .optional()
    .describe('Optional command-line arguments to pass to the script'),
})

type Result = 
  | {
      filename: string
      exit_code: number
      stdout: string
      stderr: string
      signal?: null | string
    }
  | { error: string }

export function buildRunPythonScriptTool(workspacePath: string) {
  async function execute(params: Params): Promise<Result> {
    // Security: resolve and verify the path is inside the workspace
    const scriptPath = resolve(join(workspacePath, params.filename))
    if (!scriptPath.startsWith(resolve(workspacePath) + '/') && scriptPath !== resolve(workspacePath)) {
      return { error: 'Path traversal detected: script must be inside the workspace folder' }
    }

    if (!params.filename.endsWith('.py')) {
      return { error: 'Only .py files are allowed' }
    }

    if (!existsSync(scriptPath)) {
      return { error: `Script not found: ${params.filename}` }
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        'python3',
        [scriptPath, ...(params.args ?? [])],
        {
          timeout: 30_000,
          cwd: workspacePath,
        },
      )
      return {
        filename: params.filename,
        exit_code: 0,
        stdout: stdout.slice(0, 16384),
        stderr: stderr.slice(0, 4096),
      }
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; code?: number; signal?: string }
      return {
        filename: params.filename,
        exit_code: e.code ?? 1,
        stdout: (e.stdout ?? '').slice(0, 16384),
        stderr: (e.stderr ?? String(err)).slice(0, 4096),
        signal: e.signal ?? null,
      }
    }
  }

  return defineTool({
    description:
      'Execute a Python script from the session workspace. ' +
      'Only .py files inside the workspace folder are allowed. ' +
      'Returns stdout, stderr, and exit code. Timeout: 30 seconds.',
    parameters: paramsSchema,
    execute,
  })
}

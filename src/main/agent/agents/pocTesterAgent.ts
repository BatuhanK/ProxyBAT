import { join } from 'path'
import { buildFileTools } from '../tools/file'
import { buildPocTesterTools } from '../tools/security'
import type { AgentDefinition } from './registry'
import { registerAgent } from './registry'
import { loadPrompt } from './helpers'

/**
 * PoC Tester Agent Definition
 * Executes PoC scripts and records test results.
 * Has file tools for reading/writing results and security tools for script execution.
 *
 * Role: poc_tester
 * Max steps: 40 (script testing and result recording)
 * Tools: file + security (run_python_script only)
 * Workspace: <root>/<linkedSessionId>/tests
 */
export const pocTesterAgent: AgentDefinition = {
  role: 'poc_tester',
  maxSteps: 40,

  workspacePath: ({ root, linkedSessionId, sessionId }) =>
    join(root, linkedSessionId || sessionId, 'tests'),

  systemPrompt: ({ workspacePath }) =>
    loadPrompt('poc_tester.txt').replace('{WORKSPACE_PATH}', workspacePath),

  tools: ({ workspacePath, onFileWrite }) => ({
    ...buildFileTools(workspacePath, onFileWrite),
    ...buildPocTesterTools(workspacePath),
  }),
}

// Register this agent globally
registerAgent(pocTesterAgent)

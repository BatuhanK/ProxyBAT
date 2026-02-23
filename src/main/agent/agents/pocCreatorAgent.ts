import { join } from 'path'
import { buildFileTools } from '../tools/file'
import type { AgentDefinition } from './registry'
import { registerAgent } from './registry'
import { loadPrompt } from './helpers'

/**
 * PoC Creator Agent Definition
 * Reads security reports and produces Python exploit PoC scripts.
 * Only has file tools for reading the report and writing scripts.
 *
 * Role: poc_creator
 * Max steps: 40 (script generation doesn't need heavy reasoning)
 * Tools: file only (no proxy or script management tools)
 * Workspace: <root>/<linkedSessionId>/poc
 */
export const pocCreatorAgent: AgentDefinition = {
  role: 'poc_creator',
  maxSteps: 40,

  workspacePath: ({ root, linkedSessionId, sessionId }) =>
    join(root, linkedSessionId || sessionId, 'poc'),

  systemPrompt: ({ workspacePath }) =>
    loadPrompt('poc_creator.txt').replace('{WORKSPACE_PATH}', workspacePath),

  tools: ({ workspacePath, onFileWrite }) => ({
    ...buildFileTools(workspacePath, onFileWrite),
  }),
}

// Register this agent globally
registerAgent(pocCreatorAgent)

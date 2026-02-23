import { join } from 'path'
import { buildFileTools } from '../tools/file'
import { buildProxyTools } from '../tools/proxy'
import { buildScriptTools } from '../tools/script'
import type { AgentDefinition } from './registry'
import { registerAgent } from './registry'
import { loadPrompt, buildSessionContext } from './helpers'

/**
 * General Agent Definition
 * The default, all-purpose agent with access to proxy traffic analysis,
 * file operations, and script management.
 *
 * Role: general
 * Max steps: 40 (quick analysis)
 * Tools: proxy + file + script
 * Workspace: <root>/<sessionId>
 */
export const generalAgent: AgentDefinition = {
  role: 'general',
  maxSteps: 40,

  workspacePath: ({ root, sessionId }) => join(root, sessionId),

  systemPrompt: ({ workspacePath, linkedProxySessionId }) =>
    loadPrompt('general.txt')
      .replace('{WORKSPACE_PATH}', workspacePath)
      .replace('{SESSION_CONTEXT}', buildSessionContext(linkedProxySessionId, 'general')),

  tools: ({ workspacePath, linkedProxySessionId, onFileWrite }) => ({
    ...buildProxyTools(linkedProxySessionId),
    ...buildFileTools(workspacePath, onFileWrite),
    ...buildScriptTools(),
  }),
}

// Register this agent globally
registerAgent(generalAgent)

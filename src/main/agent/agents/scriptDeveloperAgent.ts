import { join } from 'path'
import { buildFileTools } from '../tools/file'
import { buildProxyTools } from '../tools/proxy'
import { buildScriptTools } from '../tools/script'
import type { AgentDefinition } from './registry'
import { registerAgent } from './registry'
import { loadPrompt, buildSessionContext } from './helpers'

/**
 * Script Developer Agent Definition
 * Specialist in writing and debugging mitmproxy intercept scripts.
 * Has access to live traffic for inspection and script management.
 *
 * Role: script_developer
 * Max steps: 50 (detailed script development and debugging)
 * Tools: proxy + file + script
 * Workspace: <root>/<sessionId>
 */
export const scriptDeveloperAgent: AgentDefinition = {
  role: 'script_developer',
  maxSteps: 50,

  workspacePath: ({ root, sessionId }) => join(root, sessionId),

  systemPrompt: ({ workspacePath, linkedProxySessionId }) =>
    loadPrompt('script_developer.txt')
      .replace('{WORKSPACE_PATH}', workspacePath)
      .replace('{SESSION_CONTEXT}', buildSessionContext(linkedProxySessionId, 'script')),

  tools: ({ workspacePath, linkedProxySessionId, onFileWrite }) => ({
    ...buildProxyTools(linkedProxySessionId),
    ...buildFileTools(workspacePath, onFileWrite),
    ...buildScriptTools(),
  }),
}

// Register this agent globally
registerAgent(scriptDeveloperAgent)

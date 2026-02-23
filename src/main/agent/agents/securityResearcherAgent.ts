import { join } from 'path'
import { buildFileTools } from '../tools/file'
import { buildProxyTools } from '../tools/proxy'
import { buildScriptTools } from '../tools/script'
import { buildSecurityResearcherTools } from '../tools/security'
import type { AgentDefinition } from './registry'
import { registerAgent } from './registry'
import { loadPrompt, buildSessionContext } from './helpers'

/**
 * Security Researcher Agent Definition
 * Expert penetration tester with active testing capabilities.
 * Tools: proxy (traffic analysis) + file + script + security (replay/fuzz/rate-limit)
 *
 * Role: security_researcher
 * Max steps: 50 (deeper reasoning for vulnerability analysis)
 * Workspace: <root>/<sessionId>
 */
export const securityResearcherAgent: AgentDefinition = {
  role: 'security_researcher',
  maxSteps: 50,

  workspacePath: ({ root, sessionId }) => join(root, sessionId),

  systemPrompt: ({ workspacePath, linkedProxySessionId }) =>
    loadPrompt('security_researcher.txt')
      .replace('{WORKSPACE_PATH}', workspacePath)
      .replace('{SESSION_CONTEXT}', buildSessionContext(linkedProxySessionId, 'security')),

  tools: ({ workspacePath, linkedProxySessionId, onFileWrite }) => ({
    ...buildProxyTools(linkedProxySessionId),
    ...buildFileTools(workspacePath, onFileWrite),
    ...buildScriptTools(),
    ...buildSecurityResearcherTools(),
  }),
}

// Register this agent globally
registerAgent(securityResearcherAgent)

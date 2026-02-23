/**
 * Agent roles available in the system.
 * Each role has a corresponding AgentDefinition in AGENT_REGISTRY.
 */
export type AgentRole = 
  | 'general'
  | 'security_researcher'
  | 'script_developer'
  | 'poc_creator'
  | 'poc_tester'

/**
 * Context passed to agent methods at runtime.
 * Includes workspace location and optional linked proxy session.
 */
export interface AgentContext {
  workspacePath: string
  linkedProxySessionId?: string
  onFileWrite?: (path: string) => void
}

/**
 * Context for computing workspace paths.
 */
export interface WorkspaceContext {
  root: string              // workspaces root directory
  sessionId: string         // current session ID
  linkedSessionId?: string  // linked session for PoC roles
}

/**
 * Complete definition of an agent: its configuration, tools, and system prompt.
 *
 * Each agent has:
 * - A unique role identifier
 * - Max agentic steps before stopping (for different reasoning depths)
 * - A system prompt builder (given runtime context)
 * - A tools builder (given runtime context)
 * - A workspace path resolver (given session info)
 *
 * @example
 * ```ts
 * const myAgent: AgentDefinition = {
 *   role: 'general',
 *   maxSteps: 40,
 *   workspacePath: ({ root, sessionId }) => join(root, sessionId),
 *   systemPrompt: ({ workspacePath }) => loadPrompt('general.txt').replace('{WORKSPACE_PATH}', workspacePath),
 *   tools: ({ workspacePath, onFileWrite }) => ({
 *     ...buildFileTools(workspacePath, onFileWrite),
 *   }),
 * }
 * ```
 */
export interface AgentDefinition {
  role: AgentRole

  /**
   * Maximum agentic steps (loop iterations) before the agent is stopped.
   * General agents: 40 (quick analysis).
   * Security roles: 50 (deeper reasoning, active testing).
   */
  maxSteps: number

  /**
   * Build the system prompt string.
   * Called once per prompt() with workspace and session context.
   */
  systemPrompt: (ctx: AgentContext) => string

  /**
   * Build the tools object for this agent.
   * Returns a record of tool name -> tool definition.
   * Called once per prompt().
   *
   * Note: The ai SDK's Tool type is strictly typed but tools come from
   * various sources with different generics. We use `any` here to avoid
   * type mismatch errors while maintaining runtime compatibility.
   */
  tools: (ctx: AgentContext) => Record<string, any>

  /**
   * Compute the workspace path for this agent's session.
   * Called when starting a session.
   *
   * Patterns:
   * - general / security_researcher / script_developer: <root>/<sessionId>
   * - poc_creator: <root>/<linkedSessionId>/poc
   * - poc_tester: <root>/<linkedSessionId>/tests
   */
  workspacePath: (ctx: WorkspaceContext) => string
}

/**
 * Agent registry: role -> AgentDefinition mapping.
 * Populated by importing agent files and registering them.
 */
export const AGENT_REGISTRY = new Map<AgentRole, AgentDefinition>()

/**
 * Register an agent definition in the global registry.
 * Called by each agent file upon import.
 *
 * @example
 * registerAgent(generalAgent)
 */
export function registerAgent(agent: AgentDefinition): void {
  AGENT_REGISTRY.set(agent.role, agent)
}

/**
 * Retrieve an agent definition by role.
 * Throws if the role is not registered.
 */
export function getAgent(role: AgentRole): AgentDefinition {
  const agent = AGENT_REGISTRY.get(role)
  if (!agent) {
    throw new Error(`Agent not found for role: ${role}`)
  }
  return agent
}

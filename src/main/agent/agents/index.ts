/**
 * Agent registry and definitions.
 * This file imports all agent definitions, which register themselves globally.
 *
 * Import this file once in your app startup to ensure all agents are registered.
 */

export { AGENT_REGISTRY, getAgent, registerAgent } from './registry'
export type { AgentRole, AgentDefinition, AgentContext, WorkspaceContext } from './registry'

// Import all agent definitions to register them
// (side effect: each agent calls registerAgent() on import)
import './generalAgent'
import './securityResearcherAgent'
import './scriptDeveloperAgent'
import './pocCreatorAgent'
import './pocTesterAgent'

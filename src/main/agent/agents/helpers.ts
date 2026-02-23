import fs from 'fs'
import path from 'path'

/**
 * Shared utilities for agent definitions.
 * Helper functions for loading prompts and computing workspace paths.
 */

/**
 * Resolve the directory where prompt files live.
 * In dev: __dirname = out/main, prompts copied by Vite plugin.
 * Fallback to source tree for tsc --noEmit and hot-reload.
 */
export function resolvePromptsDir(): string {
  const outDir = path.join(__dirname, 'agent', 'prompts')
  if (fs.existsSync(outDir)) return outDir
  return path.join(__dirname, '..', '..', '..', 'src', 'main', 'agent', 'prompts')
}

/**
 * Load a prompt file by filename.
 * Reads from the resolved prompts directory.
 */
export function loadPrompt(filename: string): string {
  return fs.readFileSync(path.join(resolvePromptsDir(), filename), 'utf-8')
}

/**
 * Build the session context string for prompt injection.
 * Injects information about the linked proxy session if provided.
 */
export function buildSessionContext(
  linkedProxySessionId?: string,
  contextType: 'security' | 'script' | 'general' = 'security',
): string {
  if (!linkedProxySessionId) return ''

  if (contextType === 'security') {
    return (
      `## Target Proxy Session\n` +
      `You are analysing traffic from proxy session ID: **${linkedProxySessionId}**\n` +
      `When calling \`search_requests\`, \`get_session_summary\`, or any traffic tools, ` +
      `always filter by this session ID to stay focused on the correct traffic.\n`
    )
  }

  if (contextType === 'general') {
    return (
      `## Active Proxy Session\n` +
      `The user has linked proxy session ID: **${linkedProxySessionId}**\n` +
      `When calling traffic analysis tools (\`search_requests\`, \`get_session_summary\`, ` +
      `\`list_domains\`, etc.), always use this session ID to inspect the correct traffic.\n`
    )
  }

  // script context
  return (
    `## Active Proxy Session\n` +
    `Proxy session ID: **${linkedProxySessionId}**\n` +
    `When calling traffic tools (\`search_requests\`, \`get_request_detail\`, etc.), ` +
    `filter by this session ID to inspect relevant traffic.\n`
  )
}

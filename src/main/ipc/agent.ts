import { ipcMain, BrowserWindow } from 'electron'
import { AgentManager } from '../agent/AgentManager'
// Side-effect import: registers all agent definitions in AGENT_REGISTRY
import '../agent/agents/index'
import { IPC, PUSH } from '@shared/ipc-contracts'
import type {
  IpcAgentPrompt,
  IpcAgentDeleteSession,
  IpcAgentLoadSession,
  IpcAgentStartSession,
  IpcAgentUpdateSession,
  IpcAgentListWorkspaceFiles,
  IpcAgentReadWorkspaceFile,
  IpcAgentGetWorkspacePath,
} from '@shared/ipc-contracts'

function pushAgentError(sessionId: string, message: string): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(PUSH.AGENT_EVENT, { type: 'agent_error', sessionId, message })
      win.webContents.send(PUSH.AGENT_TURN_DONE, { sessionId })
    }
  }
}

export function registerAgentHandlers(): void {
  // Start a new session with a specific role (and optional linked session for PoC roles)
  ipcMain.handle(IPC.AGENT.START_SESSION, async (_event, params: IpcAgentStartSession) => {
    try {
      const manager = AgentManager.getInstance()
      const sessionId = await manager.startSession(undefined, params.role, params.linkedSessionId, params.linkedProxySessionId)
      return { sessionId, role: params.role }
    } catch (err) {
      return { error: String(err) }
    }
  })

  // Prompt is fire-and-forget — events are pushed via PUSH.AGENT_EVENT
  ipcMain.handle(IPC.AGENT.PROMPT, async (_event, params: IpcAgentPrompt) => {
    try {
      const manager = AgentManager.getInstance()

      // Ensure the session is loaded into memory before prompting.
      // We capture the resolved sessionId immediately (before any await) to
      // avoid the race where a second IPC call mutates activeSessionId.
      const resolvedSessionId = params.sessionId ?? manager.getCurrentSessionId() ?? undefined
      if (resolvedSessionId) {
        await manager.startSession(resolvedSessionId)
      } else {
        // No existing session — auto-create one, linking the proxy session if provided
        await manager.startSession(undefined, 'general', undefined, params.linkedProxySessionId)
      }

      const sessionId = params.sessionId ?? manager.getCurrentSessionId()!

      // Run prompt asynchronously — pass sessionId explicitly to avoid race condition
      manager.prompt(params.message, sessionId).catch((err) => {
        console.error('[AgentManager] prompt error:', err)
        pushAgentError(sessionId, err instanceof Error ? err.message : String(err))
      })

      return { success: true, sessionId }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.AGENT.GET_SESSIONS, async () => {
    try {
      const sessions = await AgentManager.getInstance().listSessions()
      return { sessions }
    } catch {
      return { sessions: [] }
    }
  })

  ipcMain.handle(IPC.AGENT.LOAD_SESSION, async (_event, params: IpcAgentLoadSession) => {
    try {
      const messages = await AgentManager.getInstance().loadSessionMessages(params.sessionId)
      return { messages }
    } catch {
      return { messages: [] }
    }
  })

  ipcMain.handle(IPC.AGENT.DELETE_SESSION, async (_event, params: IpcAgentDeleteSession) => {
    try {
      const success = await AgentManager.getInstance().deleteSession(params.sessionId)
      return { success }
    } catch {
      return { success: false }
    }
  })

  ipcMain.handle(IPC.AGENT.UPDATE_SESSION, async (_event, params: IpcAgentUpdateSession) => {
    try {
      const success = await AgentManager.getInstance().updateLinkedProxySession(params.sessionId, params.linkedProxySessionId)
      return { success }
    } catch {
      return { success: false }
    }
  })

  ipcMain.handle(IPC.AGENT.LIST_WORKSPACE_FILES, async (_event, params: IpcAgentListWorkspaceFiles) => {
    try {
      const manager = AgentManager.getInstance()
      // Ensure session is loaded into memory
      await manager.startSession(params.sessionId)
      const files = await manager.listWorkspaceFiles(params.sessionId)
      return { files }
    } catch {
      return { files: [] }
    }
  })

  ipcMain.handle(IPC.AGENT.READ_WORKSPACE_FILE, async (_event, params: IpcAgentReadWorkspaceFile) => {
    try {
      const manager = AgentManager.getInstance()
      await manager.startSession(params.sessionId)
      return await manager.readWorkspaceFile(params.sessionId, params.filePath)
    } catch (err) {
      return { content: '', error: String(err) }
    }
  })

  ipcMain.handle(IPC.AGENT.GET_WORKSPACE_PATH, async (_event, params: IpcAgentGetWorkspacePath) => {
    try {
      const manager = AgentManager.getInstance()
      await manager.startSession(params.sessionId)
      const workspacePath = manager.getWorkspacePath(params.sessionId)
      return { workspacePath }
    } catch {
      return { workspacePath: null }
    }
  })
}

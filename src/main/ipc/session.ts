import { ipcMain } from 'electron'
import { SessionStore } from '../storage/SessionStore'
import { RequestStore } from '../storage/RequestStore'
import { IPC } from '@shared/ipc-contracts'
import type {
  IpcSessionCreate,
  IpcSessionGet,
  IpcSessionUpdate,
  IpcSessionDelete,
  IpcSessionMerge,
  IpcSessionSetActive,
  IpcSessionGetSummary
} from '@shared/ipc-contracts'

export function registerSessionHandlers(): void {
  ipcMain.handle(IPC.SESSION.LIST, () => {
    return { sessions: SessionStore.getInstance().list() }
  })

  ipcMain.handle(IPC.SESSION.CREATE, (_event, params: IpcSessionCreate) => {
    const session = SessionStore.getInstance().create(params?.name)
    return { session }
  })

  ipcMain.handle(IPC.SESSION.GET, (_event, params: IpcSessionGet) => {
    return { session: SessionStore.getInstance().getById(params.sessionId) }
  })

  ipcMain.handle(IPC.SESSION.UPDATE, (_event, params: IpcSessionUpdate) => {
    const success = SessionStore.getInstance().update(params.sessionId, { name: params.name })
    return { success }
  })

  ipcMain.handle(IPC.SESSION.DELETE, (_event, params: IpcSessionDelete) => {
    const success = SessionStore.getInstance().delete(params.sessionId)
    return { success }
  })

  ipcMain.handle(IPC.SESSION.MERGE, (_event, params: IpcSessionMerge) => {
    const success = SessionStore.getInstance().merge(params.sourceSessionId, params.targetSessionId)
    const targetSession = success
      ? SessionStore.getInstance().getById(params.targetSessionId)
      : undefined
    return { success, targetSession }
  })

  ipcMain.handle(IPC.SESSION.SET_ACTIVE, (_event, _params: IpcSessionSetActive) => {
    // The active session is tracked by ProxyManager
    // This handler is for UI state only — renderer keeps track
    return { success: true }
  })

  ipcMain.handle(IPC.SESSION.GET_SUMMARY, (_event, params: IpcSessionGetSummary) => {
    const summary = RequestStore.getInstance().getSessionSummary(params.sessionId)
    return { summary }
  })
}

import { ipcMain } from 'electron'
import { ScriptStore } from '../storage/ScriptStore'
import { ProxyManager } from '../proxy/ProxyManager'
import { IPC } from '@shared/ipc-contracts'
import type {
  IpcScriptCreate,
  IpcScriptUpdate,
  IpcScriptDelete
} from '@shared/ipc-contracts'

function syncScripts(): void {
  ProxyManager.getInstance().sendScripts()
}

export function registerScriptHandlers(): void {
  ipcMain.handle(IPC.SCRIPT.LIST, () => {
    return { scripts: ScriptStore.getInstance().list() }
  })

  ipcMain.handle(IPC.SCRIPT.CREATE, (_event, params: IpcScriptCreate) => {
    const script = ScriptStore.getInstance().create({
      name: params.name,
      code: params.code,
      phase: params.phase,
      enabled: params.enabled
    })
    syncScripts()
    return { script }
  })

  ipcMain.handle(IPC.SCRIPT.UPDATE, (_event, params: IpcScriptUpdate) => {
    const success = ScriptStore.getInstance().update(params.id, {
      name: params.name,
      code: params.code,
      phase: params.phase,
      enabled: params.enabled
    })
    syncScripts()
    return { success }
  })

  ipcMain.handle(IPC.SCRIPT.DELETE, (_event, params: IpcScriptDelete) => {
    const success = ScriptStore.getInstance().delete(params.id)
    syncScripts()
    return { success }
  })
}

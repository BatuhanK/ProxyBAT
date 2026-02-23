import { ipcMain } from 'electron'
import { SslRuleStore } from '../storage/SslRuleStore'
import { ProxyManager } from '../proxy/ProxyManager'
import { IPC } from '@shared/ipc-contracts'
import type {
  IpcSslRuleCreate,
  IpcSslRuleUpdate,
  IpcSslRuleDelete
} from '@shared/ipc-contracts'

export function registerSslRuleHandlers(): void {
  ipcMain.handle(IPC.SSL_RULE.LIST, () => {
    return { rules: SslRuleStore.getInstance().list() }
  })

  ipcMain.handle(IPC.SSL_RULE.CREATE, (_event, params: IpcSslRuleCreate) => {
    const rule = SslRuleStore.getInstance().create(params.pattern, params.enabled)
    // Push updated rules to running mitmproxy instance
    ProxyManager.getInstance().sendSslRules()
    return { rule }
  })

  ipcMain.handle(IPC.SSL_RULE.UPDATE, (_event, params: IpcSslRuleUpdate) => {
    const success = SslRuleStore.getInstance().update(params.id, {
      pattern: params.pattern,
      enabled: params.enabled
    })
    ProxyManager.getInstance().sendSslRules()
    return { success }
  })

  ipcMain.handle(IPC.SSL_RULE.DELETE, (_event, params: IpcSslRuleDelete) => {
    const success = SslRuleStore.getInstance().delete(params.id)
    ProxyManager.getInstance().sendSslRules()
    return { success }
  })
}

import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-contracts'
import { IgnoreRuleStore } from '../storage/IgnoreRuleStore'

export function registerIgnoreRuleHandlers(): void {
  ipcMain.handle(IPC.IGNORE_RULE.LIST, () => {
    return { rules: IgnoreRuleStore.getInstance().list() }
  })

  ipcMain.handle(IPC.IGNORE_RULE.CREATE, (_e, params: { pattern: string; enabled?: boolean }) => {
    const rule = IgnoreRuleStore.getInstance().create(params.pattern, params.enabled ?? true)
    return { rule }
  })

  ipcMain.handle(IPC.IGNORE_RULE.UPDATE, (_e, params: { id: string; pattern?: string; enabled?: boolean }) => {
    const success = IgnoreRuleStore.getInstance().update(params.id, {
      pattern: params.pattern,
      enabled: params.enabled,
    })
    return { success }
  })

  ipcMain.handle(IPC.IGNORE_RULE.DELETE, (_e, params: { id: string }) => {
    const success = IgnoreRuleStore.getInstance().delete(params.id)
    return { success }
  })
}

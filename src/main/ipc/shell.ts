import { ipcMain, shell } from 'electron'
import { IPC } from '@shared/ipc-contracts'
import type { IpcShellOpenPath } from '@shared/ipc-contracts'

export function registerShellHandlers(): void {
  ipcMain.handle(IPC.SHELL.OPEN_PATH, async (_event, params: IpcShellOpenPath) => {
    try {
      const errMsg = await shell.openPath(params.path)
      if (errMsg) return { success: false, error: errMsg }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}

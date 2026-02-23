import { ipcMain, dialog } from 'electron'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'
import { SettingsStore } from '../storage/SettingsStore'
import { IPC } from '@shared/ipc-contracts'
import type { IpcSettingsUpdate, IpcSettingsUpdateAi } from '@shared/ipc-contracts'
import type { CrawledAiKeys } from '@shared/types'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.SETTINGS.GET, () => {
    return { settings: SettingsStore.getInstance().getProxySettings() }
  })

  ipcMain.handle(IPC.SETTINGS.UPDATE, (_event, params: IpcSettingsUpdate) => {
    SettingsStore.getInstance().updateProxySettings(params.settings)
    return { success: true }
  })

  ipcMain.handle(IPC.SETTINGS.PICK_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Agent Workspace Folder',
    })
    if (result.canceled || result.filePaths.length === 0) return { path: null }
    return { path: result.filePaths[0] }
  })

  // ─── AI Provider settings ───────────────────────────────────────────────────

  ipcMain.handle(IPC.SETTINGS.GET_AI, () => {
    return { settings: SettingsStore.getInstance().getAiProviderSettings() }
  })

  ipcMain.handle(IPC.SETTINGS.UPDATE_AI, (_event, params: IpcSettingsUpdateAi) => {
    SettingsStore.getInstance().updateAiProviderSettings(params.settings)
    return { success: true }
  })

  ipcMain.handle(IPC.SETTINGS.CRAWL_OPENCODE, () => {
    // Check if `opencode` binary is available on PATH
    let opencodeInPath = false
    try {
      execSync('which opencode', { stdio: 'ignore' })
      opencodeInPath = true
    } catch {
      // not found
    }

    const authPath = join(homedir(), '.local', 'share', 'opencode', 'auth.json')
    if (!existsSync(authPath)) {
      return { found: { opencodeInPath }, fileFound: false }
    }
    try {
      const raw = readFileSync(authPath, 'utf8')
      const data = JSON.parse(raw) as Record<string, { type: string; key?: string; access?: string }>
      const found: CrawledAiKeys = { opencodeInPath }

      // Kimi
      if (data['kimi-for-coding']?.key) found.kimiApiKey = data['kimi-for-coding'].key
      // GitHub Copilot
      if (data['github-copilot']?.access) found.copilotApiKey = data['github-copilot'].access
      // ZAI — prefer zai-coding-plan key (has coding endpoint), fall back to zhipuai
      if (data['zai-coding-plan']?.key) found.zaiApiKey = data['zai-coding-plan'].key
      else if (data['zhipuai']?.key) found.zaiApiKey = data['zhipuai'].key

      return { found, fileFound: true }
    } catch (err) {
      return { found: { opencodeInPath }, fileFound: true, error: String(err) }
    }
  })
}


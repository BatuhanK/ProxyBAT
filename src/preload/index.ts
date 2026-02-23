import { contextBridge, ipcRenderer } from 'electron'
import { IPC, PUSH } from '../shared/ipc-contracts'
import type {
  // Proxy
  IpcProxyStart, IpcProxyStartResult,
  IpcProxyStop, IpcProxyStopResult,
  IpcProxyGetStatusResult,
  // Sessions
  IpcSessionCreate, IpcSessionCreateResult,
  IpcSessionListResult,
  IpcSessionGet, IpcSessionGetResult,
  IpcSessionUpdate, IpcSessionUpdateResult,
  IpcSessionDelete, IpcSessionDeleteResult,
  IpcSessionMerge, IpcSessionMergeResult,
  IpcSessionSetActive, IpcSessionSetActiveResult,
  IpcSessionGetSummary, IpcSessionGetSummaryResult,
  // Requests
  IpcRequestList, IpcRequestListResult,
  IpcRequestGet, IpcRequestGetResult,
  IpcRequestGetBody, IpcRequestGetBodyResult,
  IpcRequestDelete, IpcRequestDeleteResult,
  IpcRequestClear, IpcRequestClearResult,
  IpcRequestDeleteFiltered, IpcRequestDeleteFilteredResult,
  IpcRequestResend, IpcRequestResendResult,
  // SSL Rules
  IpcSslRuleCreate, IpcSslRuleCreateResult,
  IpcSslRuleListResult,
  IpcSslRuleUpdate, IpcSslRuleUpdateResult,
  IpcSslRuleDelete, IpcSslRuleDeleteResult,
  // Certificate
  IpcCertificateGetResult,
  IpcCertificateExport, IpcCertificateExportResult,
  IpcCertificateRegenerateResult,
  // Settings
  IpcSettingsGetResult,
  IpcSettingsUpdate, IpcSettingsUpdateResult,
  IpcSettingsPickFolderResult,
  IpcSettingsGetAiResult,
  IpcSettingsUpdateAi, IpcSettingsUpdateAiResult,
  IpcSettingsCrawlOpencodeResult,
  // Doctor
  IpcDoctorCheckResult, IpcDoctorInstallResult,
  // Scripts
  IpcScriptListResult,
  IpcScriptCreate, IpcScriptCreateResult,
  IpcScriptUpdate, IpcScriptUpdateResult,
  IpcScriptDelete, IpcScriptDeleteResult,
  // Ignore Rules
  IpcIgnoreRuleListResult,
  IpcIgnoreRuleCreate, IpcIgnoreRuleCreateResult,
  IpcIgnoreRuleUpdate, IpcIgnoreRuleUpdateResult,
  IpcIgnoreRuleDelete, IpcIgnoreRuleDeleteResult,
  // Agent
  IpcAgentPrompt, IpcAgentPromptResult,
  IpcAgentStartSession, IpcAgentStartSessionResult,
  IpcAgentGetSessionsResult,
  IpcAgentLoadSession, IpcAgentLoadSessionResult,
  IpcAgentDeleteSession, IpcAgentDeleteSessionResult,
  IpcAgentUpdateSession, IpcAgentUpdateSessionResult,
  IpcAgentListWorkspaceFiles, IpcAgentListWorkspaceFilesResult,
  IpcAgentReadWorkspaceFile, IpcAgentReadWorkspaceFileResult,
  IpcAgentGetWorkspacePath, IpcAgentGetWorkspacePathResult,
  // Terminal
  IpcTerminalCreate, IpcTerminalCreateResult,
  IpcTerminalWrite, IpcTerminalWriteResult,
  IpcTerminalResize, IpcTerminalResizeResult,
  IpcTerminalClose, IpcTerminalCloseResult,
  // System Proxy
  IpcSystemProxyGetStatusResult,
  IpcSystemProxySet, IpcSystemProxySetResult,
  IpcSystemProxyUnsetResult,
  // Shell
  IpcShellOpenPathResult,
  // Push payloads
  PushRequestCaptured,
  PushProxyStatusChanged,
  PushAgentEvent,
  PushAgentTurnDone,
  PushAgentTitleUpdated,
  PushScriptLog,
  PushWorkspaceFilesChanged,
  PushTerminalData,
  PushConnectionError,
} from '../shared/ipc-contracts'

// Expose typed IPC API to renderer
const api = {
  // Proxy
  proxy: {
    start: (params?: IpcProxyStart): Promise<IpcProxyStartResult> =>
      ipcRenderer.invoke(IPC.PROXY.START, params),
    stop: (params?: IpcProxyStop): Promise<IpcProxyStopResult> =>
      ipcRenderer.invoke(IPC.PROXY.STOP, params),
    getStatus: (): Promise<IpcProxyGetStatusResult> =>
      ipcRenderer.invoke(IPC.PROXY.GET_STATUS)
  },

  // Sessions
  session: {
    list: (): Promise<IpcSessionListResult> =>
      ipcRenderer.invoke(IPC.SESSION.LIST),
    create: (params?: IpcSessionCreate): Promise<IpcSessionCreateResult> =>
      ipcRenderer.invoke(IPC.SESSION.CREATE, params),
    get: (params: IpcSessionGet): Promise<IpcSessionGetResult> =>
      ipcRenderer.invoke(IPC.SESSION.GET, params),
    update: (params: IpcSessionUpdate): Promise<IpcSessionUpdateResult> =>
      ipcRenderer.invoke(IPC.SESSION.UPDATE, params),
    delete: (params: IpcSessionDelete): Promise<IpcSessionDeleteResult> =>
      ipcRenderer.invoke(IPC.SESSION.DELETE, params),
    merge: (params: IpcSessionMerge): Promise<IpcSessionMergeResult> =>
      ipcRenderer.invoke(IPC.SESSION.MERGE, params),
    setActive: (params: IpcSessionSetActive): Promise<IpcSessionSetActiveResult> =>
      ipcRenderer.invoke(IPC.SESSION.SET_ACTIVE, params),
    getSummary: (params: IpcSessionGetSummary): Promise<IpcSessionGetSummaryResult> =>
      ipcRenderer.invoke(IPC.SESSION.GET_SUMMARY, params)
  },

  // Requests
  request: {
    list: (params: IpcRequestList): Promise<IpcRequestListResult> =>
      ipcRenderer.invoke(IPC.REQUEST.LIST, params),
    get: (params: IpcRequestGet): Promise<IpcRequestGetResult> =>
      ipcRenderer.invoke(IPC.REQUEST.GET, params),
    getBody: (params: IpcRequestGetBody): Promise<IpcRequestGetBodyResult> =>
      ipcRenderer.invoke(IPC.REQUEST.GET_BODY, params),
    delete: (params: IpcRequestDelete): Promise<IpcRequestDeleteResult> =>
      ipcRenderer.invoke(IPC.REQUEST.DELETE, params),
    clear: (params: IpcRequestClear): Promise<IpcRequestClearResult> =>
      ipcRenderer.invoke(IPC.REQUEST.CLEAR, params),
    deleteFiltered: (params: IpcRequestDeleteFiltered): Promise<IpcRequestDeleteFilteredResult> =>
      ipcRenderer.invoke(IPC.REQUEST.DELETE_FILTERED, params),
    resend: (params: IpcRequestResend): Promise<IpcRequestResendResult> =>
      ipcRenderer.invoke(IPC.REQUEST.RESEND, params),
  },

  // SSL Rules
  sslRule: {
    list: (): Promise<IpcSslRuleListResult> =>
      ipcRenderer.invoke(IPC.SSL_RULE.LIST),
    create: (params: IpcSslRuleCreate): Promise<IpcSslRuleCreateResult> =>
      ipcRenderer.invoke(IPC.SSL_RULE.CREATE, params),
    update: (params: IpcSslRuleUpdate): Promise<IpcSslRuleUpdateResult> =>
      ipcRenderer.invoke(IPC.SSL_RULE.UPDATE, params),
    delete: (params: IpcSslRuleDelete): Promise<IpcSslRuleDeleteResult> =>
      ipcRenderer.invoke(IPC.SSL_RULE.DELETE, params)
  },

  // Certificate
  certificate: {
    get: (): Promise<IpcCertificateGetResult> =>
      ipcRenderer.invoke(IPC.CERTIFICATE.GET),
    export: (params?: IpcCertificateExport): Promise<IpcCertificateExportResult> =>
      ipcRenderer.invoke(IPC.CERTIFICATE.EXPORT, params),
    regenerate: (): Promise<IpcCertificateRegenerateResult> =>
      ipcRenderer.invoke(IPC.CERTIFICATE.REGENERATE)
  },

  // Settings
  settings: {
    get: (): Promise<IpcSettingsGetResult> =>
      ipcRenderer.invoke(IPC.SETTINGS.GET),
    update: (params: IpcSettingsUpdate): Promise<IpcSettingsUpdateResult> =>
      ipcRenderer.invoke(IPC.SETTINGS.UPDATE, params),
    pickFolder: (): Promise<IpcSettingsPickFolderResult> =>
      ipcRenderer.invoke(IPC.SETTINGS.PICK_FOLDER),
    getAi: (): Promise<IpcSettingsGetAiResult> =>
      ipcRenderer.invoke(IPC.SETTINGS.GET_AI),
    updateAi: (params: IpcSettingsUpdateAi): Promise<IpcSettingsUpdateAiResult> =>
      ipcRenderer.invoke(IPC.SETTINGS.UPDATE_AI, params),
    crawlOpencode: (): Promise<IpcSettingsCrawlOpencodeResult> =>
      ipcRenderer.invoke(IPC.SETTINGS.CRAWL_OPENCODE),
  },

  // Doctor
  doctor: {
    check: (): Promise<IpcDoctorCheckResult> =>
      ipcRenderer.invoke(IPC.DOCTOR.CHECK),
    installMitmproxy: (): Promise<IpcDoctorInstallResult> =>
      ipcRenderer.invoke(IPC.DOCTOR.INSTALL_MITMPROXY),
  },

  // Scripts
  script: {
    list: (): Promise<IpcScriptListResult> =>
      ipcRenderer.invoke(IPC.SCRIPT.LIST),
    create: (params: IpcScriptCreate): Promise<IpcScriptCreateResult> =>
      ipcRenderer.invoke(IPC.SCRIPT.CREATE, params),
    update: (params: IpcScriptUpdate): Promise<IpcScriptUpdateResult> =>
      ipcRenderer.invoke(IPC.SCRIPT.UPDATE, params),
    delete: (params: IpcScriptDelete): Promise<IpcScriptDeleteResult> =>
      ipcRenderer.invoke(IPC.SCRIPT.DELETE, params)
  },

  // Agent
  agent: {
    prompt: (params: IpcAgentPrompt): Promise<IpcAgentPromptResult> =>
      ipcRenderer.invoke(IPC.AGENT.PROMPT, params),
    startSession: (params: IpcAgentStartSession): Promise<IpcAgentStartSessionResult> =>
      ipcRenderer.invoke(IPC.AGENT.START_SESSION, params),
    getSessions: (): Promise<IpcAgentGetSessionsResult> =>
      ipcRenderer.invoke(IPC.AGENT.GET_SESSIONS),
    loadSession: (params: IpcAgentLoadSession): Promise<IpcAgentLoadSessionResult> =>
      ipcRenderer.invoke(IPC.AGENT.LOAD_SESSION, params),
    deleteSession: (params: IpcAgentDeleteSession): Promise<IpcAgentDeleteSessionResult> =>
      ipcRenderer.invoke(IPC.AGENT.DELETE_SESSION, params),
    updateSession: (params: IpcAgentUpdateSession): Promise<IpcAgentUpdateSessionResult> =>
      ipcRenderer.invoke(IPC.AGENT.UPDATE_SESSION, params),
    listWorkspaceFiles: (params: IpcAgentListWorkspaceFiles): Promise<IpcAgentListWorkspaceFilesResult> =>
      ipcRenderer.invoke(IPC.AGENT.LIST_WORKSPACE_FILES, params),
    readWorkspaceFile: (params: IpcAgentReadWorkspaceFile): Promise<IpcAgentReadWorkspaceFileResult> =>
      ipcRenderer.invoke(IPC.AGENT.READ_WORKSPACE_FILE, params),
    getWorkspacePath: (params: IpcAgentGetWorkspacePath): Promise<IpcAgentGetWorkspacePathResult> =>
      ipcRenderer.invoke(IPC.AGENT.GET_WORKSPACE_PATH, params)
  },

  // Terminal
  terminal: {
    create: (params: IpcTerminalCreate): Promise<IpcTerminalCreateResult> =>
      ipcRenderer.invoke(IPC.TERMINAL.CREATE, params),
    write: (params: IpcTerminalWrite): Promise<IpcTerminalWriteResult> =>
      ipcRenderer.invoke(IPC.TERMINAL.WRITE, params),
    resize: (params: IpcTerminalResize): Promise<IpcTerminalResizeResult> =>
      ipcRenderer.invoke(IPC.TERMINAL.RESIZE, params),
    close: (params: IpcTerminalClose): Promise<IpcTerminalCloseResult> =>
      ipcRenderer.invoke(IPC.TERMINAL.CLOSE, params)
  },

  // System Proxy
  systemProxy: {
    getStatus: (): Promise<IpcSystemProxyGetStatusResult> =>
      ipcRenderer.invoke(IPC.SYSTEM_PROXY.GET_STATUS),
    set: (params: IpcSystemProxySet): Promise<IpcSystemProxySetResult> =>
      ipcRenderer.invoke(IPC.SYSTEM_PROXY.SET, params),
    unset: (): Promise<IpcSystemProxyUnsetResult> =>
      ipcRenderer.invoke(IPC.SYSTEM_PROXY.UNSET)
  },

  // Ignore Rules
  ignoreRule: {
    list: (): Promise<IpcIgnoreRuleListResult> =>
      ipcRenderer.invoke(IPC.IGNORE_RULE.LIST),
    create: (params: IpcIgnoreRuleCreate): Promise<IpcIgnoreRuleCreateResult> =>
      ipcRenderer.invoke(IPC.IGNORE_RULE.CREATE, params),
    update: (params: IpcIgnoreRuleUpdate): Promise<IpcIgnoreRuleUpdateResult> =>
      ipcRenderer.invoke(IPC.IGNORE_RULE.UPDATE, params),
    delete: (params: IpcIgnoreRuleDelete): Promise<IpcIgnoreRuleDeleteResult> =>
      ipcRenderer.invoke(IPC.IGNORE_RULE.DELETE, params)
  },

  // Shell
  shell: {
    openPath: (path: string): Promise<IpcShellOpenPathResult> =>
      ipcRenderer.invoke(IPC.SHELL.OPEN_PATH, { path })
  },

  // Push event listeners
  // Each returns an unsubscribe function that removes only the specific listener,
  // so multiple subscribers on the same channel coexist correctly.
  on: {
    requestCaptured: (cb: (data: PushRequestCaptured) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: PushRequestCaptured) => cb(data)
      ipcRenderer.on(PUSH.REQUEST_CAPTURED, handler)
      return () => ipcRenderer.removeListener(PUSH.REQUEST_CAPTURED, handler)
    },
    proxyStatusChanged: (cb: (data: PushProxyStatusChanged) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: PushProxyStatusChanged) => cb(data)
      ipcRenderer.on(PUSH.PROXY_STATUS_CHANGED, handler)
      return () => ipcRenderer.removeListener(PUSH.PROXY_STATUS_CHANGED, handler)
    },
    agentEvent: (cb: (data: PushAgentEvent) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: PushAgentEvent) => cb(data)
      ipcRenderer.on(PUSH.AGENT_EVENT, handler)
      return () => ipcRenderer.removeListener(PUSH.AGENT_EVENT, handler)
    },
    agentTurnDone: (cb: (data: PushAgentTurnDone) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: PushAgentTurnDone) => cb(data)
      ipcRenderer.on(PUSH.AGENT_TURN_DONE, handler)
      return () => ipcRenderer.removeListener(PUSH.AGENT_TURN_DONE, handler)
    },
    agentTitleUpdated: (cb: (data: PushAgentTitleUpdated) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: PushAgentTitleUpdated) => cb(data)
      ipcRenderer.on(PUSH.AGENT_TITLE_UPDATED, handler)
      return () => ipcRenderer.removeListener(PUSH.AGENT_TITLE_UPDATED, handler)
    },
    scriptLog: (cb: (data: PushScriptLog) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: PushScriptLog) => cb(data)
      ipcRenderer.on(PUSH.SCRIPT_LOG, handler)
      return () => ipcRenderer.removeListener(PUSH.SCRIPT_LOG, handler)
    },
    workspaceFilesChanged: (cb: (data: PushWorkspaceFilesChanged) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: PushWorkspaceFilesChanged) => cb(data)
      ipcRenderer.on(PUSH.WORKSPACE_FILES_CHANGED, handler)
      return () => ipcRenderer.removeListener(PUSH.WORKSPACE_FILES_CHANGED, handler)
    },
    terminalData: (cb: (data: PushTerminalData) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: PushTerminalData) => cb(data)
      ipcRenderer.on(PUSH.TERMINAL_DATA, handler)
      return () => ipcRenderer.removeListener(PUSH.TERMINAL_DATA, handler)
    },
    connectionError: (cb: (data: PushConnectionError) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, data: PushConnectionError) => cb(data)
      ipcRenderer.on(PUSH.CONNECTION_ERROR, handler)
      return () => ipcRenderer.removeListener(PUSH.CONNECTION_ERROR, handler)
    },
  }
}

contextBridge.exposeInMainWorld('api', api)

export type AppApi = typeof api

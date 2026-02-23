// Type-safe IPC channel contracts
// Every channel has a defined request and response type.
// Main process handlers and renderer invokers must match these types.

import type {
  ProxySession,
  HttpRequest,
  SslRule,
  IgnoreRule,
  InterceptScript,
  ProxySettings,
  ProxyStatus,
  CertificateInfo,
  DoctorCheckResult,
  DoctorInstallResult,
  SessionSummary,
  AiProviderSettings,
  CrawledAiKeys,
} from './types'

// ─── Proxy Control ───────────────────────────────────────────────────────────

export interface IpcProxyStart {
  settings?: Partial<ProxySettings>
  /** Session ID to reactivate (continue existing session). If not provided, creates a new session. */
  sessionId?: string
  /** Optional name for a new session. If omitted, auto-generated. */
  sessionName?: string
}
export interface IpcProxyStartResult {
  success: boolean
  error?: string
  port?: number
}

export interface IpcProxyStop {
  sessionId: string
}
export interface IpcProxyStopResult {
  success: boolean
  error?: string
}

export interface IpcProxyGetStatus {
  // no params
}
export interface IpcProxyGetStatusResult {
  status: ProxyStatus
  port: number | null
  activeSessionId: string | null
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export interface IpcSessionList {
  // no params
}
export interface IpcSessionListResult {
  sessions: ProxySession[]
}

export interface IpcSessionCreate {
  name?: string
}
export interface IpcSessionCreateResult {
  session: ProxySession
}

export interface IpcSessionGet {
  sessionId: string
}
export interface IpcSessionGetResult {
  session: ProxySession | null
}

export interface IpcSessionUpdate {
  sessionId: string
  name: string
}
export interface IpcSessionUpdateResult {
  success: boolean
}

export interface IpcSessionDelete {
  sessionId: string
}
export interface IpcSessionDeleteResult {
  success: boolean
}

export interface IpcSessionMerge {
  sourceSessionId: string
  targetSessionId: string
}
export interface IpcSessionMergeResult {
  success: boolean
  targetSession?: ProxySession
}

export interface IpcSessionSetActive {
  sessionId: string
}
export interface IpcSessionSetActiveResult {
  success: boolean
}

export interface IpcSessionGetSummary {
  sessionId: string
}
export interface IpcSessionGetSummaryResult {
  summary: SessionSummary | null
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface IpcRequestList {
  sessionId: string
  limit?: number
  offset?: number
  search?: string
  method?: string
  host?: string
  statusCode?: number
  statusCategory?: '2xx' | '3xx' | '4xx' | '5xx'
}
export interface IpcRequestListResult {
  requests: HttpRequest[]
  total: number
}

export interface IpcRequestGet {
  requestId: string
}
export interface IpcRequestGetResult {
  request: HttpRequest | null
}

export interface IpcRequestGetBody {
  key: string
  offset?: number
  limit?: number
}
export interface IpcRequestGetBodyResult {
  body: string
  totalBytes: number
  encoding: string
}

export interface IpcRequestDelete {
  requestId: string
}
export interface IpcRequestDeleteResult {
  success: boolean
}

export interface IpcRequestClear {
  sessionId: string
}
export interface IpcRequestClearResult {
  success: boolean
  deleted: number
}

export interface IpcRequestDeleteFiltered {
  sessionId: string
  search?: string
  method?: string
  statusCategory?: string
  /** Resource type string (e.g. 'image', 'script') — translated to content_type LIKE patterns in DB */
  resourceType?: string
  /** If true, delete requests NOT matching the filter; if false/omitted, delete matching requests */
  invert?: boolean
}
export interface IpcRequestDeleteFilteredResult {
  success: boolean
  deleted: number
}

// ─── SSL Rules ────────────────────────────────────────────────────────────────

export interface IpcSslRuleList {
  // no params
}
export interface IpcSslRuleListResult {
  rules: SslRule[]
}

export interface IpcSslRuleCreate {
  pattern: string
  enabled?: boolean
}
export interface IpcSslRuleCreateResult {
  rule: SslRule
}

export interface IpcSslRuleUpdate {
  id: string
  pattern?: string
  enabled?: boolean
}
export interface IpcSslRuleUpdateResult {
  success: boolean
}

export interface IpcSslRuleDelete {
  id: string
}
export interface IpcSslRuleDeleteResult {
  success: boolean
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export interface IpcCertificateGet {
  // no params
}
export interface IpcCertificateGetResult {
  info: CertificateInfo | null
  pemPath: string | null
}

export interface IpcCertificateExport {
  targetPath: string
}
export interface IpcCertificateExportResult {
  success: boolean
  path?: string
  error?: string
}

export interface IpcCertificateRegenerate {
  // no params
}
export interface IpcCertificateRegenerateResult {
  success: boolean
  info?: CertificateInfo
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface IpcSettingsGet {
  // no params
}
export interface IpcSettingsGetResult {
  settings: ProxySettings
}

export interface IpcSettingsUpdate {
  settings: Partial<ProxySettings>
}
export interface IpcSettingsUpdateResult {
  success: boolean
}

export interface IpcSettingsPickFolder {
  // no params
}
export interface IpcSettingsPickFolderResult {
  path: string | null
}

export interface IpcSettingsGetAi {
  // no params
}
export interface IpcSettingsGetAiResult {
  settings: AiProviderSettings
}

export interface IpcSettingsUpdateAi {
  settings: Partial<AiProviderSettings>
}
export interface IpcSettingsUpdateAiResult {
  success: boolean
}

export interface IpcSettingsCrawlOpencode {
  // no params
}
export interface IpcSettingsCrawlOpencodeResult {
  found: CrawledAiKeys
  /** Whether the auth.json file was found at all */
  fileFound: boolean
  error?: string
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export interface IpcDoctorCheck {
  // no params
}

export interface IpcDoctorCheckResult extends DoctorCheckResult {}

export interface IpcDoctorInstall {
  // no params
}

export interface IpcDoctorInstallResult extends DoctorInstallResult {}

// ─── Scripts ─────────────────────────────────────────────────────────────────

export interface IpcScriptList {
  // no params
}
export interface IpcScriptListResult {
  scripts: InterceptScript[]
}

export interface IpcScriptCreate {
  name: string
  code: string
  phase: InterceptScript['phase']
  enabled?: boolean
}
export interface IpcScriptCreateResult {
  script: InterceptScript
}

export interface IpcScriptUpdate {
  id: string
  name?: string
  code?: string
  phase?: InterceptScript['phase']
  enabled?: boolean
}
export interface IpcScriptUpdateResult {
  success: boolean
}

export interface IpcScriptDelete {
  id: string
}
export interface IpcScriptDeleteResult {
  success: boolean
}

// ─── Ignore Rules ────────────────────────────────────────────────────────────

export interface IpcIgnoreRuleList {
  // no params
}
export interface IpcIgnoreRuleListResult {
  rules: IgnoreRule[]
}

export interface IpcIgnoreRuleCreate {
  pattern: string
  enabled?: boolean
}
export interface IpcIgnoreRuleCreateResult {
  rule: IgnoreRule
}

export interface IpcIgnoreRuleUpdate {
  id: string
  pattern?: string
  enabled?: boolean
}
export interface IpcIgnoreRuleUpdateResult {
  success: boolean
}

export interface IpcIgnoreRuleDelete {
  id: string
}
export interface IpcIgnoreRuleDeleteResult {
  success: boolean
}

// ─── System Proxy ─────────────────────────────────────────────────────────────

export interface IpcSystemProxyGetStatus {
  // no params
}
export interface SystemProxyServiceStatus {
  service: string
  httpEnabled: boolean
  httpHost: string
  httpPort: number | null
  httpsEnabled: boolean
  httpsHost: string
  httpsPort: number | null
}
export interface IpcSystemProxyGetStatusResult {
  services: SystemProxyServiceStatus[]
  error?: string
}

export interface IpcSystemProxySet {
  port: number
  host?: string
}
export interface IpcSystemProxySetResult {
  success: boolean
  error?: string
}

export interface IpcSystemProxyUnset {
  // no params
}
export interface IpcSystemProxyUnsetResult {
  success: boolean
  error?: string
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export type AgentRole = 'general' | 'security_researcher' | 'poc_creator' | 'poc_tester' | 'script_developer'

export interface IpcAgentPrompt {
  message: string
  sessionId?: string
  /** Proxy session to auto-link when a new session is created via this prompt */
  linkedProxySessionId?: string
}
export interface IpcAgentPromptResult {
  success: boolean
  sessionId?: string
  error?: string
}

export interface IpcAgentStartSession {
  role: AgentRole
  linkedSessionId?: string
  /** Active proxy session ID to link for traffic analysis */
  linkedProxySessionId?: string
}
export interface IpcAgentStartSessionResult {
  sessionId: string
  role: AgentRole
}

export interface IpcAgentGetSessions {
  // no params
}
export interface IpcAgentGetSessionsResult {
  sessions: Array<{ id: string; title: string; role: AgentRole; linkedProxySessionId: string | null; updatedAt: number }>
}

export interface IpcAgentLoadSession {
  sessionId: string
}
export interface IpcAgentLoadSessionResult {
  messages: Array<{ role: string; content: string; created_at: number }>
}

export interface IpcAgentDeleteSession {
  sessionId: string
}
export interface IpcAgentDeleteSessionResult {
  success: boolean
}

export interface IpcAgentUpdateSession {
  sessionId: string
  linkedProxySessionId: string | null
}
export interface IpcAgentUpdateSessionResult {
  success: boolean
}

export interface IpcAgentListWorkspaceFiles {
  sessionId: string
}
export interface WorkspaceFileEntry {
  path: string
  size: number
  modifiedAt: number
}
export interface IpcAgentListWorkspaceFilesResult {
  files: WorkspaceFileEntry[]
}

export interface IpcAgentReadWorkspaceFile {
  sessionId: string
  filePath: string
}
export interface IpcAgentReadWorkspaceFileResult {
  content: string
  error?: string
}

export interface IpcAgentGetWorkspacePath {
  sessionId: string
}
export interface IpcAgentGetWorkspacePathResult {
  workspacePath: string | null
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export interface IpcShellOpenPath {
  path: string
}
export interface IpcShellOpenPathResult {
  success: boolean
  error?: string
}

// ─── Terminal ─────────────────────────────────────────────────────────────────

export interface IpcTerminalCreate {
  sessionId: string
}
export interface IpcTerminalCreateResult {
  terminalId: string
  error?: string
}

export interface IpcTerminalWrite {
  terminalId: string
  data: string
}
export interface IpcTerminalWriteResult {
  success: boolean
}

export interface IpcTerminalResize {
  terminalId: string
  cols: number
  rows: number
}
export interface IpcTerminalResizeResult {
  success: boolean
}

export interface IpcTerminalClose {
  terminalId: string
}
export interface IpcTerminalCloseResult {
  success: boolean
}

// ─── Request Resend ───────────────────────────────────────────────────────────

export interface IpcRequestResend {
  method: string
  url: string
  headers: Record<string, string>
  body?: string | null
  curlBinary?: string
}

export interface IpcRequestResendResult {
  statusCode: number
  statusText: string
  headers: Record<string, string>
  body: string
  durationMs: number
  error?: string
}

// ─── IPC Channel Names ────────────────────────────────────────────────────────
// Single source of truth for all channel strings

export const IPC = {
  PROXY: {
    START: 'proxy:start',
    STOP: 'proxy:stop',
    GET_STATUS: 'proxy:get-status'
  },
  SESSION: {
    LIST: 'session:list',
    CREATE: 'session:create',
    GET: 'session:get',
    UPDATE: 'session:update',
    DELETE: 'session:delete',
    MERGE: 'session:merge',
    SET_ACTIVE: 'session:set-active',
    GET_SUMMARY: 'session:get-summary'
  },
  REQUEST: {
    LIST: 'request:list',
    GET: 'request:get',
    GET_BODY: 'request:get-body',
    DELETE: 'request:delete',
    CLEAR: 'request:clear',
    DELETE_FILTERED: 'request:delete-filtered',
    RESEND: 'request:resend'
  },
  SSL_RULE: {
    LIST: 'ssl-rule:list',
    CREATE: 'ssl-rule:create',
    UPDATE: 'ssl-rule:update',
    DELETE: 'ssl-rule:delete'
  },
  CERTIFICATE: {
    GET: 'certificate:get',
    EXPORT: 'certificate:export',
    REGENERATE: 'certificate:regenerate'
  },
  SETTINGS: {
    GET: 'settings:get',
    UPDATE: 'settings:update',
    PICK_FOLDER: 'settings:pick-folder',
    GET_AI: 'settings:get-ai',
    UPDATE_AI: 'settings:update-ai',
    CRAWL_OPENCODE: 'settings:crawl-opencode'
  },
  DOCTOR: {
    CHECK: 'doctor:check',
    INSTALL_MITMPROXY: 'doctor:install-mitmproxy'
  },
  SCRIPT: {
    LIST: 'script:list',
    CREATE: 'script:create',
    UPDATE: 'script:update',
    DELETE: 'script:delete'
  },
  IGNORE_RULE: {
    LIST: 'ignore-rule:list',
    CREATE: 'ignore-rule:create',
    UPDATE: 'ignore-rule:update',
    DELETE: 'ignore-rule:delete'
  },
  AGENT: {
    PROMPT: 'agent:prompt',
    START_SESSION: 'agent:start-session',
    GET_SESSIONS: 'agent:get-sessions',
    LOAD_SESSION: 'agent:load-session',
    DELETE_SESSION: 'agent:delete-session',
    UPDATE_SESSION: 'agent:update-session',
    LIST_WORKSPACE_FILES: 'agent:list-workspace-files',
    READ_WORKSPACE_FILE: 'agent:read-workspace-file',
    GET_WORKSPACE_PATH: 'agent:get-workspace-path'
  },
  TERMINAL: {
    CREATE: 'terminal:create',
    WRITE: 'terminal:write',
    RESIZE: 'terminal:resize',
    CLOSE: 'terminal:close'
  },
  SHELL: {
    OPEN_PATH: 'shell:open-path'
  },
  SYSTEM_PROXY: {
    GET_STATUS: 'system-proxy:get-status',
    SET: 'system-proxy:set',
    UNSET: 'system-proxy:unset'
  }
} as const

// ─── Push events from main → renderer ────────────────────────────────────────

export const PUSH = {
  REQUEST_CAPTURED: 'push:request-captured',
  PROXY_STATUS_CHANGED: 'push:proxy-status-changed',
  AGENT_EVENT: 'push:agent-event',
  AGENT_TURN_DONE: 'push:agent-turn-done',
  AGENT_TITLE_UPDATED: 'push:agent-title-updated',
  SCRIPT_LOG: 'push:script-log',
  WORKSPACE_FILES_CHANGED: 'push:workspace-files-changed',
  TERMINAL_DATA: 'push:terminal-data',
  CONNECTION_ERROR: 'push:connection-error',
} as const

// ─── Push event payload types ─────────────────────────────────────────────────

/** Emitted when a new HTTP request is captured by the proxy. */
export type PushRequestCaptured = HttpRequest

/** Emitted when the proxy status changes. */
export interface PushProxyStatusChanged {
  status: ProxyStatus
  port: number | null
  activeSessionId: string | null
}

/** Emitted for each streaming chunk from an agent turn. Discriminated by `type`. */
export type PushAgentEvent =
  | { type: 'text_delta'; text: string; sessionId: string }
  | { type: 'tool_start'; id: string; name: string; args: string; sessionId: string }
  | { type: 'tool_done'; id: string; result: string; sessionId: string }
  | { type: 'agent_error'; sessionId: string; message: string }

/** Emitted when an agent turn completes. */
export interface PushAgentTurnDone {
  sessionId: string
}

/** Emitted when the agent generates a session title. */
export interface PushAgentTitleUpdated {
  sessionId: string
  title: string
}

/** Emitted when an intercept script writes a log or throws an error. */
export interface PushScriptLog {
  id: number
  script: string
  level: string
  message: string
  timestamp: number
}

/** Emitted when a file in an agent's workspace changes. */
export interface PushWorkspaceFilesChanged {
  sessionId: string
  filePath: string
}

/** Emitted for each chunk of PTY output from a terminal. */
export interface PushTerminalData {
  terminalId: string
  data: string
}

/** Emitted when the proxy encounters a connection error to a target host. */
export interface PushConnectionError {
  host: string
  reason: string
  errorType: string
  timestamp: number
}

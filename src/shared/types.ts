// Shared types used by both main and renderer processes

export type AiProvider = 'kimi' | 'copilot' | 'zai' | 'codex'

export type KimiModelId = 'k2p5'

export type CopilotModelId =
  | 'claude-opus-4'
  | 'claude-opus-41'
  | 'claude-3.5-sonnet'
  | 'claude-3.7-sonnet'
  | 'claude-3.7-sonnet-thought'
  | 'claude-sonnet-4'
  | 'claude-sonnet-4.5'
  | 'gemini-2.0-flash-001'
  | 'gemini-2.5-pro'
  | 'gpt-4.1'
  | 'gpt-4o'
  | 'gpt-5'
  | 'gpt-5-codex'
  | 'gpt-5-mini'
  | 'grok-code-fast-1'
  | 'o3'
  | 'o3-mini'
  | 'o4-mini'
  | 'gpt-5.1-codex'
  | 'gpt-5.1-codex-mini'
  | 'gpt-5.1-codex-max'
  | 'gpt-5.2'

export type ZaiModelId = 'glm-5'

export type CodexModelId =
  | 'gpt-5.2-codex'
  | 'gpt-5.2'
  | 'gpt-5.1-codex-max'
  | 'gpt-5.1-codex-mini'
  | 'gpt-5.1'
  | 'gpt-5.1-codex'
  | 'gpt-5'
  | 'gpt-5-codex'
  | 'gpt-5-codex-mini'

export interface AiProviderSettings {
  activeProvider: AiProvider
  activeModel: string
  kimiApiKey: string
  copilotApiKey: string
  zaiApiKey: string
  /** Absolute path to the codex binary, empty string if not configured */
  codexPath: string
}

export interface CrawledAiKeys {
  kimiApiKey?: string
  copilotApiKey?: string
  zaiApiKey?: string
  /** true when the `opencode` binary was found on PATH */
  opencodeInPath?: boolean
}

export type ProxyStatus = "stopped" | "starting" | "running" | "error";

export type SessionStatus = "active" | "stopped";

export interface ProxySession {
  id: string;
  name: string;
  startedAt: number;
  endedAt: number | null;
  status: SessionStatus;
  requestCount: number;
}

export interface HttpRequest {
  id: string;
  sessionId: string;
  timestamp: number;
  method: string;
  url: string;
  host: string;
  path: string;
  statusCode: number | null;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBodyKey: string | null;
  responseBodyKey: string | null;
  requestBodySize: number | null;
  responseBodySize: number | null;
  contentType: string | null;
  durationMs: number | null;
  sslIntercepted: boolean;
}

export interface SslRule {
  id: string;
  pattern: string;
  enabled: boolean;
  createdAt: number;
}

export interface IgnoreRule {
  id: string;
  /** Wildcard pattern matched against the full request URL (e.g. "*.google.com/*" or "*\/favicon.ico") */
  pattern: string;
  enabled: boolean;
  createdAt: number;
}

export interface InterceptScript {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  phase: "request" | "response" | "both";
  createdAt: number;
  updatedAt: number;
}

export interface ProxySettings {
  port: number;
  host: string;
  sslEnabled: boolean;
  workspaceDir: string;
  /** Path to the curl binary used by security tools (e.g. /opt/homebrew/bin/curl_chrome110) */
  curlBinary: string;
}

export interface CertificateInfo {
  fingerprint: string;
  validFrom: string;
  validTo: string;
  subject: string;
  issuer: string;
}

export interface DoctorBinaryStatus {
  found: boolean;
  path?: string;
  version?: string;
  error?: string;
}

export type DoctorInstallerManager =
  | "brew"
  | "apt"
  | "dnf"
  | "pacman"
  | "winget"
  | "choco";

export interface DoctorInstallerPlan {
  supported: boolean;
  manager?: DoctorInstallerManager;
  command?: string;
  requiresAdmin: boolean;
  note?: string;
}

export interface DoctorCheckResult {
  platform: string;
  mitmdump: DoctorBinaryStatus;
  mitmproxy: DoctorBinaryStatus;
  installer: DoctorInstallerPlan;
}

export interface DoctorInstallResult {
  success: boolean;
  command?: string;
  output?: string;
  error?: string;
}

// Proxy tool result types for AgentB
export interface RequestSearchResult {
  requests: HttpRequest[];
  total: number;
}

export interface SessionSummary {
  session: ProxySession;
  totalRequests: number;
  domains: string[];
  statusCodeBreakdown: Record<string, number>;
  avgDurationMs: number | null;
  errorCount: number;
  sslInterceptedCount: number;
}

import { PUSH } from "@shared/ipc-contracts";
import type { InterceptScript, ProxyStatus } from "@shared/types";
import { ChildProcess, execSync, spawn } from "child_process";
import { app, BrowserWindow } from "electron";
import { existsSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { BodyStore } from "../storage/BodyStore";
import { IgnoreRuleStore } from "../storage/IgnoreRuleStore";
import { RequestStore } from "../storage/RequestStore";
import { ScriptStore } from "../storage/ScriptStore";
import { SettingsStore } from "../storage/SettingsStore";
import { SslRuleStore } from "../storage/SslRuleStore";

// Candidate locations for mitmdump binary
const MITMDUMP_CANDIDATES = [
  "mitmdump", // on PATH
  "/opt/homebrew/bin/mitmdump", // macOS Homebrew
  "/usr/local/bin/mitmdump", // Linux/macOS
  "/usr/bin/mitmdump", // Linux system
];

// Resolve the addon script path — works both in dev and packaged app
function getAddonScriptPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, "proxy_addon.py");
  }
  // In dev: project root / resources / proxy_addon.py
  return join(app.getAppPath(), "resources", "proxy_addon.py");
}

function findMitmdump(): string {
  // Prefer explicit setting from user config
  const settings = SettingsStore.getInstance();
  const configured = settings.get("mitmdumpPath");
  if (configured && existsSync(configured as string))
    return configured as string;

  for (const candidate of MITMDUMP_CANDIDATES) {
    if (candidate === "mitmdump") return candidate; // let shell resolve it
    if (existsSync(candidate)) return candidate;
  }
  return "mitmdump"; // fall back — will error with a clear message
}

// Build a clean environment that inherits PATH so mitmdump can be found
function buildEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) env[k] = v;
  }
  // Ensure common binary dirs are on PATH in case Electron stripped them
  const extra = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  const existing = (env["PATH"] || "").split(":");
  const merged = [...new Set([...extra, ...existing])].join(":");
  env["PATH"] = merged;
  return env;
}

interface RequestLine {
  type: "request";
  id: string;
  method: string;
  url: string;
  host: string;
  path: string;
  request_headers: Record<string, string>;
  request_body: string | null; // base64
  ssl: boolean;
  timestamp: number;
}

interface ResponseLine {
  type: "response";
  id: string;
  status: number;
  response_headers: Record<string, string>;
  response_body: string | null; // base64
  content_type: string | null;
  duration_ms: number;
}

type AddonLine =
  | RequestLine
  | ResponseLine
  | { type: "ready" }
  | { type: "error"; id?: string; message: string }
  | {
      type: "connection_error";
      host: string;
      reason: string;
      error_type: string;
    }
  | { type: "script_error"; script: string; error: string }
  | { type: "script_log"; script: string; level: string; message: string };

export class ProxyManager {
  private static instance: ProxyManager;
  private proc: ChildProcess | null = null;
  private status: ProxyStatus = "stopped";
  private activeSessionId: string | null = null;
  private activePort: number | null = null;
  // Buffer incoming partial lines
  private lineBuffer = "";
  // Map mitmproxy flow id → our request id (uuid)
  private flowToRequest = new Map<string, string>();
  private startResolve: ((port: number) => void) | null = null;
  private startReject: ((err: Error) => void) | null = null;

  // Port conflict detection
  private _portConflictDetected = false;

  // In-memory script log buffer — read by the agent via script_get_logs tool
  private _scriptLogs: Array<{
    id: number;
    script: string;
    level: string;
    message: string;
    timestamp: number;
  }> = [];
  private _scriptLogNextId = 1;
  private static readonly SCRIPT_LOG_MAX = 500;

  static getInstance(): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager();
    }
    return ProxyManager.instance;
  }

  getStatus(): ProxyStatus {
    return this.status;
  }
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }
  getActivePort(): number | null {
    return this.activePort;
  }

  /**
   * Check if port is in use and kill mitmproxy/mitmdump processes if found.
   * Returns info about the process that was using the port.
   */
  private async killMitmproxyOnPort(port: number): Promise<{
    killed: boolean;
    processName?: string;
    pid?: number;
  }> {
    try {
      // Get PIDs using the port
      const lsofResult = execSync(`lsof -ti tcp:${port}`, {
        encoding: "utf8",
      }).trim();
      if (!lsofResult) return { killed: false };

      const pids = lsofResult.split("\n").filter((p) => p.trim());

      for (const pidStr of pids) {
        const pid = parseInt(pidStr, 10);
        if (isNaN(pid)) continue;

        try {
          // Get process name and full command line
          const processName = execSync(`ps -p ${pid} -o comm=`, {
            encoding: "utf8",
          }).trim();
          const fullCommand = execSync(`ps -p ${pid} -o args=`, {
            encoding: "utf8",
          }).trim();

          // Check if it's mitm-related (by name or full command)
          if (
            processName.includes("mitm") ||
            processName.includes("mitmdump") ||
            fullCommand.includes("mitm") ||
            fullCommand.includes("mitmdump")
          ) {
            console.log(
              `[ProxyManager] Killing ${processName} (PID: ${pid}) on port ${port}`,
            );
            execSync(`kill -9 ${pid}`);
            return { killed: true };
          }

          // Return info about the first blocking process
          return { killed: false, processName, pid };
        } catch {
          // Process might have exited already, continue to next
          continue;
        }
      }

      return { killed: false };
    } catch {
      // lsof failed or no processes found
      return { killed: false };
    }
  }

  /** Return recent script log entries, optionally filtered by script name and/or level. */
  getScriptLogs(
    opts: { script?: string; level?: string; limit?: number } = {},
  ): typeof this._scriptLogs {
    let logs = this._scriptLogs;
    if (opts.script) logs = logs.filter((e) => e.script === opts.script);
    if (opts.level) logs = logs.filter((e) => e.level === opts.level);
    const limit = opts.limit ?? 50;
    return logs.slice(-limit);
  }

  async start(sessionId: string, isRetry = false): Promise<{ port: number }> {
    if (this.status === "running" && !isRetry)
      throw new Error("Proxy is already running");

    const settings = SettingsStore.getInstance().getProxySettings();
    const port = settings.port;

    // Check and clean up port before starting
    if (!isRetry) {
      const cleanup = await this.killMitmproxyOnPort(port);
      if (cleanup.killed) {
        console.log(
          `[ProxyManager] Cleaned up existing mitmproxy on port ${port}`,
        );
        // Wait for port to be released
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else if (cleanup.processName) {
        throw new Error(
          `Port ${port} is already in use by ${cleanup.processName} (PID: ${cleanup.pid}). Please stop that process or choose a different port.`,
        );
      }
    }

    this.setStatus("starting");
    this.activeSessionId = sessionId;
    this._portConflictDetected = false;
    this.flowToRequest.clear();
    this.lineBuffer = "";
    const host = settings.host || "127.0.0.1";
    const mitmdump = findMitmdump();
    const addonPath = getAddonScriptPath();

    const args = [
      "-q", // quiet (no TUI noise on stderr)
      "--listen-host",
      host,
      "--listen-port",
      String(port),
      "--ssl-insecure", // don't verify upstream certs (MITM needs this)
      "--no-http2", // disable HTTP/2 to avoid protocol errors with whitespace headers
      "-s",
      addonPath,
    ];

    this.proc = spawn(mitmdump, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: buildEnv(),
      detached: false,
    });

    this.proc.stdout!.setEncoding("utf8");
    this.proc.stdout!.on("data", (chunk: string) => this.handleStdout(chunk));

    this.proc.stderr!.setEncoding("utf8");
    this.proc.stderr!.on("data", (chunk: string) => {
      const lines = chunk.split("\n").filter((l) => {
        const t = l.trim();
        if (!t) return false;
        if (t.includes("DeprecationWarning")) return false;
        if (t.includes("CryptographyDeprecationWarning")) return false;
        // HTTP/2 client-side stream resets are normal (client closes connection early)
        if (t.includes("stream reset by client")) return false;
        if (t.includes("CANCEL")) return false;
        // HTTP/2 protocol errors with whitespace headers (some servers send these)
        if (t.includes("HTTP/2 protocol error") && t.includes("whitespace"))
          return false;
        // HTTP/2 protocol errors in CLOSED state are benign (connection already closed)
        if (t.includes("ConnectionState.CLOSED")) return false;
        if (t.includes("RECV_HEADERS") && t.includes("CLOSED")) return false;
        // Check for port conflict
        if (t.includes("address already in use") || t.includes("[Errno 48]")) {
          this._portConflictDetected = true;
          console.warn("[ProxyManager] Port conflict detected:", t);
        }
        return true;
      });
      if (lines.length) console.error("[mitmdump]", lines.join("\n"));
    });

    this.proc.on("error", (err) => {
      console.error("[ProxyManager] spawn error:", err);
      this.cleanup();
      this.setStatus("error");
      this.startReject?.(err);
      this.startReject = null;
      this.startResolve = null;
    });

    this.proc.on("exit", (code, signal) => {
      if (this.status !== "stopped") {
        console.warn(
          `[ProxyManager] mitmdump exited unexpectedly: code=${code} signal=${signal}`,
        );

        // If port conflict was detected, provide helpful error message
        if (this._portConflictDetected && this.startReject) {
          const error = new Error(
            `Failed to start proxy: Port ${port} is already in use. Please check if another proxy is running.`,
          );
          this.cleanup();
          this.setStatus("error");
          this.startReject(error);
          this.startReject = null;
          this.startResolve = null;
          return;
        }

        this.cleanup();
        this.setStatus("stopped");
      }
    });

    return new Promise<{ port: number }>((resolve, reject) => {
      this.startResolve = (p) => {
        resolve({ port: p });
        // Send any existing enabled scripts and SSL rules to the addon after it's ready
        this.sendScripts();
        this.sendSslRules();
      };
      this.startReject = reject;
      // Fallback: if no "ready" event within 8s, assume started anyway
      setTimeout(() => {
        if (this.startResolve) {
          this.activePort = port;
          this.setStatus("running");
          this.startResolve(port);
          this.startResolve = null;
          this.startReject = null;
        }
      }, 8000);
    });
  }

  /** Send all enabled scripts to the mitmproxy addon via stdin. */
  sendScripts(scripts?: InterceptScript[]): void {
    if (!this.proc?.stdin) return;
    const toSend = scripts ?? ScriptStore.getInstance().listEnabled();
    const payload =
      JSON.stringify({ cmd: "set_scripts", scripts: toSend }) + "\n";
    try {
      this.proc.stdin.write(payload);
    } catch (e) {
      console.error("[ProxyManager] sendScripts write error:", e);
    }
  }

  /** Send all enabled SSL rules to the mitmproxy addon via stdin. */
  sendSslRules(): void {
    if (!this.proc?.stdin) return;
    const rules = SslRuleStore.getInstance().list();
    const payload = JSON.stringify({ cmd: "set_ssl_rules", rules }) + "\n";
    try {
      this.proc.stdin.write(payload);
    } catch (e) {
      console.error("[ProxyManager] sendSslRules write error:", e);
    }
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    this.proc.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        this.proc?.kill("SIGKILL");
        resolve();
      }, 3000);
      this.proc!.once("exit", () => {
        clearTimeout(t);
        resolve();
      });
    });
    this.cleanup();
    this.setStatus("stopped");
  }

  private cleanup(): void {
    this.proc = null;
    this.activePort = null;
    this.activeSessionId = null;
    this._portConflictDetected = false;
    this.flowToRequest.clear();
    this.lineBuffer = "";
    this.startResolve = null;
    this.startReject = null;
  }

  private handleStdout(chunk: string): void {
    this.lineBuffer += chunk;
    const lines = this.lineBuffer.split("\n");
    this.lineBuffer = lines.pop() ?? ""; // keep incomplete last line
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const msg = JSON.parse(trimmed) as AddonLine;
        this.handleAddonMessage(msg);
      } catch (err) {
        // Not JSON — just log
        console.log("[mitmdump]", trimmed);
      }
    }
  }

  private handleAddonMessage(msg: AddonLine): void {
    switch (msg.type) {
      case "ready": {
        console.log(`[ProxyManager] mitmdump ready on port ${this.activePort}`);
        // Reset conflict flag on successful start
        this._portConflictDetected = false;
        if (this.startResolve) {
          this.activePort =
            this.activePort ??
            SettingsStore.getInstance().getProxySettings().port;
          this.setStatus("running");
          this.startResolve(this.activePort);
          this.startResolve = null;
          this.startReject = null;
        }
        break;
      }

      case "request": {
        // Drop request silently if it matches an ignore rule
        if (IgnoreRuleStore.getInstance().shouldIgnore(msg.url)) {
          console.log("[ProxyManager] Ignoring request:", msg.method, msg.url);
          break;
        }

        if (!this.activeSessionId) {
          console.error(
            "[ProxyManager] No active session - dropping request:",
            msg.url,
          );
          break;
        }

        const requestId = uuidv4();
        this.flowToRequest.set(msg.id, requestId);
        // console.log('[ProxyManager] Tracked request:', msg.method, msg.url, 'flowId:', msg.id, 'requestId:', requestId)

        let requestBodyKey: string | null = null;
        let requestBodySize: number | null = null;
        if (msg.request_body) {
          requestBodyKey = `req:${requestId}`;
          const buf = Buffer.from(msg.request_body, "base64");
          requestBodySize = buf.length;
          BodyStore.getInstance()
            .put(requestBodyKey, buf)
            .catch((e) => console.error("[BodyStore] put error:", e));
        }

        try {
          RequestStore.getInstance().create({
            id: requestId,
            sessionId: this.activeSessionId,
            method: msg.method,
            url: msg.url,
            host: msg.host,
            path: msg.path,
            requestHeaders: msg.request_headers,
            requestBodyKey,
            requestBodySize,
            sslIntercepted: msg.ssl,
            timestamp: Math.floor(msg.timestamp * 1000),
          });
        } catch (err) {
          console.error("[ProxyManager] Failed to create request:", err);
        }
        break;
      }

      case "response": {
        const requestId = this.flowToRequest.get(msg.id);
        if (!requestId) {
          console.warn(
            "[ProxyManager] Response received but no matching request:",
            msg.id,
            "- status:",
            msg.status,
            "- flowToRequest size:",
            this.flowToRequest.size,
          );
          return;
        }

        let responseBodyKey: string | null = null;
        let responseBodySize: number | null = null;
        if (msg.response_body) {
          responseBodyKey = `res:${requestId}`;
          const buf = Buffer.from(msg.response_body, "base64");
          responseBodySize = buf.length;
          BodyStore.getInstance()
            .put(responseBodyKey, buf)
            .catch((e) => console.error("[BodyStore] put error:", e));
        }

        try {
          RequestStore.getInstance().update(requestId, {
            statusCode: msg.status,
            responseHeaders: msg.response_headers,
            responseBodyKey,
            responseBodySize,
            contentType: msg.content_type,
            durationMs: msg.duration_ms,
          });

          // Push completed request to renderer
          const request = RequestStore.getInstance().getById(requestId);
          if (request) {
            this.pushToRenderer(PUSH.REQUEST_CAPTURED, request);
          }
        } catch (err) {
          console.error("[ProxyManager] Failed to update request:", err);
        }

        this.flowToRequest.delete(msg.id);
        // console.log('[ProxyManager] Completed request:', requestId, '- flowId:', msg.id)
        break;
      }

      case "error": {
        console.error(
          "[mitmdump addon error]",
          (msg as { type: string; message: string }).message,
        );
        if ((msg as { id?: string }).id) {
          console.log(
            "[ProxyManager] Removing flow from map due to error:",
            (msg as { id: string }).id,
          );
          this.flowToRequest.delete((msg as { id: string }).id);
        }
        break;
      }

      case "connection_error": {
        const ce = msg as {
          type: string;
          host: string;
          reason: string;
          error_type: string;
        };
        this.pushToRenderer(PUSH.CONNECTION_ERROR, {
          host: ce.host,
          reason: ce.reason,
          errorType: ce.error_type,
          timestamp: Date.now(),
        });
        break;
      }

      case "script_error": {
        const logEntry = {
          id: this._scriptLogNextId++,
          script: msg.script as string,
          level: "error",
          message: msg.error as string,
          timestamp: Date.now(),
        };
        this._scriptLogs.push(logEntry);
        if (this._scriptLogs.length > ProxyManager.SCRIPT_LOG_MAX) {
          this._scriptLogs = this._scriptLogs.slice(
            -ProxyManager.SCRIPT_LOG_MAX,
          );
        }
        this.pushToRenderer(PUSH.SCRIPT_LOG, logEntry);
        break;
      }

      case "script_log": {
        const logEntry = {
          id: this._scriptLogNextId++,
          script: msg.script as string,
          level: msg.level as string,
          message: msg.message as string,
          timestamp: Date.now(),
        };
        this._scriptLogs.push(logEntry);
        if (this._scriptLogs.length > ProxyManager.SCRIPT_LOG_MAX) {
          this._scriptLogs = this._scriptLogs.slice(
            -ProxyManager.SCRIPT_LOG_MAX,
          );
        }
        this.pushToRenderer(PUSH.SCRIPT_LOG, logEntry);
        break;
      }
    }
  }

  private setStatus(status: ProxyStatus): void {
    this.status = status;
    this.pushToRenderer(PUSH.PROXY_STATUS_CHANGED, {
      status,
      port: this.activePort,
      activeSessionId: this.activeSessionId,
    });
  }

  private pushToRenderer(channel: string, data: unknown): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) win.webContents.send(channel, data);
    }
  }
}

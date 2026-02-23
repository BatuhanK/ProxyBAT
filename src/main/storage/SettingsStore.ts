import type {
  AiProvider,
  AiProviderSettings,
  ProxySettings,
} from "@shared/types";
import { homedir } from "os";
import { join } from "path";
import { Database } from "./Database";

const DEFAULT_WORKSPACE_DIR = join(homedir(), "Desktop", "ProxyBat");

const DEFAULT_AI_PROVIDER: AiProvider = "kimi";
const DEFAULT_AI_MODEL = "k2p5";

// Default codex path — auto-detected common locations
const COMMON_CODEX_PATHS = [
  "/opt/homebrew/bin/codex",
  "/usr/local/bin/codex",
  "/usr/bin/codex",
];

export class SettingsStore {
  private static instance: SettingsStore;

  static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
    }
    return SettingsStore.instance;
  }

  private get db() {
    return Database.getInstance().getDb();
  }

  get(key: string): string | null {
    const row = this.db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  set(key: string, value: string): void {
    this.db
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, value);
  }

  getWorkspaceDir(): string {
    return this.get("workspace_dir") ?? DEFAULT_WORKSPACE_DIR;
  }

  setWorkspaceDir(dir: string): void {
    this.set("workspace_dir", dir);
  }

  getCurlBinary(): string {
    return this.get("curl_binary") ?? "curl";
  }

  setCurlBinary(binary: string): void {
    this.set("curl_binary", binary);
  }

  getProxySettings(): ProxySettings {
    return {
      port: parseInt(this.get("proxy_port") ?? "8080", 10),
      host: this.get("proxy_host") ?? "0.0.0.0",
      sslEnabled: this.get("ssl_enabled") !== "false",
      workspaceDir: this.getWorkspaceDir(),
      curlBinary: this.getCurlBinary(),
    };
  }

  updateProxySettings(settings: Partial<ProxySettings>): void {
    if (settings.port !== undefined)
      this.set("proxy_port", String(settings.port));
    if (settings.host !== undefined) this.set("proxy_host", settings.host);
    if (settings.sslEnabled !== undefined)
      this.set("ssl_enabled", String(settings.sslEnabled));
    if (settings.workspaceDir !== undefined)
      this.setWorkspaceDir(settings.workspaceDir);
    if (settings.curlBinary !== undefined)
      this.setCurlBinary(settings.curlBinary);
  }

  // ─── AI Provider settings ───────────────────────────────────────────────────

  getAiProviderSettings(): AiProviderSettings {
    // Auto-detect codex binary if not configured
    const storedCodexPath = this.get("ai_codex_path") ?? "";
    let codexPath = storedCodexPath;
    if (!codexPath) {
      const { existsSync } = require("fs") as typeof import("fs");
      for (const p of COMMON_CODEX_PATHS) {
        if (existsSync(p)) {
          codexPath = p;
          break;
        }
      }
    }
    return {
      activeProvider:
        (this.get("ai_active_provider") as AiProvider | null) ??
        DEFAULT_AI_PROVIDER,
      activeModel: this.get("ai_active_model") ?? DEFAULT_AI_MODEL,
      kimiApiKey: this.get("ai_kimi_key") ?? "",
      copilotApiKey: this.get("ai_copilot_key") ?? "",
      zaiApiKey: this.get("ai_zai_key") ?? "",
      codexPath,
    };
  }

  updateAiProviderSettings(settings: Partial<AiProviderSettings>): void {
    if (settings.activeProvider !== undefined)
      this.set("ai_active_provider", settings.activeProvider);
    if (settings.activeModel !== undefined)
      this.set("ai_active_model", settings.activeModel);
    if (settings.kimiApiKey !== undefined)
      this.set("ai_kimi_key", settings.kimiApiKey);
    if (settings.copilotApiKey !== undefined)
      this.set("ai_copilot_key", settings.copilotApiKey);
    if (settings.zaiApiKey !== undefined)
      this.set("ai_zai_key", settings.zaiApiKey);
    if (settings.codexPath !== undefined)
      this.set("ai_codex_path", settings.codexPath);
  }
}

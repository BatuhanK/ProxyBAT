import type { AiProvider } from "@shared/types";

// Known curl-impersonate presets (plus plain curl as fallback)
export const CURL_PRESETS = [
  { label: "curl (system default)", value: "curl" },
  { label: "curl_chrome110", value: "/opt/homebrew/bin/curl_chrome110" },
  { label: "curl_chrome107", value: "/opt/homebrew/bin/curl_chrome107" },
  { label: "curl_chrome104", value: "/opt/homebrew/bin/curl_chrome104" },
  { label: "curl_chrome101", value: "/opt/homebrew/bin/curl_chrome101" },
  { label: "curl_chrome100", value: "/opt/homebrew/bin/curl_chrome100" },
  { label: "curl_chrome99", value: "/opt/homebrew/bin/curl_chrome99" },
  {
    label: "curl_chrome99_android",
    value: "/opt/homebrew/bin/curl_chrome99_android",
  },
  { label: "curl_edge101", value: "/opt/homebrew/bin/curl_edge101" },
  { label: "curl_edge99", value: "/opt/homebrew/bin/curl_edge99" },
  { label: "curl_safari15_5", value: "/opt/homebrew/bin/curl_safari15_5" },
  { label: "curl_safari15_3", value: "/opt/homebrew/bin/curl_safari15_3" },
  {
    label: "curl-impersonate-chrome",
    value: "/opt/homebrew/bin/curl-impersonate-chrome",
  },
];

// AI Provider model lists
export const KIMI_MODELS = [{ label: "k2p5 — Kimi 2.5", value: "k2p5" }];

export const COPILOT_MODELS = [
  { label: "claude-sonnet-4.5", value: "claude-sonnet-4.5" },
  { label: "claude-sonnet-4", value: "claude-sonnet-4" },
  { label: "claude-opus-4", value: "claude-opus-4" },
  { label: "claude-opus-41", value: "claude-opus-41" },
  { label: "claude-3.5-sonnet", value: "claude-3.5-sonnet" },
  { label: "claude-3.7-sonnet", value: "claude-3.7-sonnet" },
  { label: "claude-3.7-sonnet-thought", value: "claude-3.7-sonnet-thought" },
  { label: "gemini-2.5-pro", value: "gemini-2.5-pro" },
  { label: "gemini-2.0-flash-001", value: "gemini-2.0-flash-001" },
  { label: "gpt-5", value: "gpt-5" },
  { label: "gpt-5.2", value: "gpt-5.2" },
  { label: "gpt-5-codex", value: "gpt-5-codex" },
  { label: "gpt-5-mini", value: "gpt-5-mini" },
  { label: "gpt-5.1-codex", value: "gpt-5.1-codex" },
  { label: "gpt-5.1-codex-mini", value: "gpt-5.1-codex-mini" },
  { label: "gpt-5.1-codex-max", value: "gpt-5.1-codex-max" },
  { label: "gpt-4.1", value: "gpt-4.1" },
  { label: "gpt-4o", value: "gpt-4o" },
  { label: "o4-mini", value: "o4-mini" },
  { label: "o3", value: "o3" },
  { label: "o3-mini", value: "o3-mini" },
  { label: "grok-code-fast-1", value: "grok-code-fast-1" },
];

export const ZAI_MODELS = [{ label: "glm-5 — GLM Coding Plan", value: "glm-5" }];

export const DEEPSEEK_MODELS = [
  { label: "deepseek-v4-flash — Fast", value: "deepseek-v4-flash" },
  { label: "deepseek-v4-pro — Pro reasoning", value: "deepseek-v4-pro" },
];

export const CODEX_MODELS = [
  { label: "gpt-5.2-codex — Latest agentic", value: "gpt-5.2-codex" },
  { label: "gpt-5.2 — Latest general purpose", value: "gpt-5.2" },
  {
    label: "gpt-5.1-codex-max — Flagship (deep reasoning)",
    value: "gpt-5.1-codex-max",
  },
  { label: "gpt-5.1-codex-mini — Lightweight", value: "gpt-5.1-codex-mini" },
  { label: "gpt-5.1 — General purpose", value: "gpt-5.1" },
  { label: "gpt-5.1-codex", value: "gpt-5.1-codex" },
  { label: "gpt-5", value: "gpt-5" },
  { label: "gpt-5-codex", value: "gpt-5-codex" },
  { label: "gpt-5-codex-mini", value: "gpt-5-codex-mini" },
];

export const PROVIDER_MODELS: Record<AiProvider, { label: string; value: string }[]> =
  {
    kimi: KIMI_MODELS,
    copilot: COPILOT_MODELS,
    zai: ZAI_MODELS,
    codex: CODEX_MODELS,
    deepseek: DEEPSEEK_MODELS,
  };

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  kimi: "Kimi (Moonshot)",
  copilot: "GitHub Copilot",
  zai: "ZAI / GLM-5",
  codex: "Codex CLI",
  deepseek: "DeepSeek",
};

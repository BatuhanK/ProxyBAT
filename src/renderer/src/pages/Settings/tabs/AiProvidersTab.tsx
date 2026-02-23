import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import type { AiProvider, AiProviderSettings, CrawledAiKeys } from "@shared/types";
import { Bot, Download as ImportIcon, Eye, EyeOff } from "lucide-react";
import { Section } from "../components";
import { PROVIDER_LABELS, PROVIDER_MODELS } from "../constants";

interface AiProvidersTabProps {
  aiSettings: AiProviderSettings;
  setAiSettings: (fn: (s: AiProviderSettings) => AiProviderSettings) => void;
  aiSaving: boolean;
  aiSaveMsg: string;
  showKimiKey: boolean;
  setShowKimiKey: (fn: (v: boolean) => boolean) => void;
  showCopilotKey: boolean;
  setShowCopilotKey: (fn: (v: boolean) => boolean) => void;
  showZaiKey: boolean;
  setShowZaiKey: (fn: (v: boolean) => boolean) => void;
  opencodeInPath: boolean;
  crawlLoading: boolean;
  crawlFound: CrawledAiKeys | null;
  crawlError: string;
  crawlSelected: Set<keyof CrawledAiKeys>;
  setCrawlSelected: (fn: (s: Set<keyof CrawledAiKeys>) => Set<keyof CrawledAiKeys>) => void;
  setCrawlFound: (value: CrawledAiKeys | null) => void;
  saveAiSettings: () => void;
  crawlOpencode: () => void;
  applyCrawledKeys: () => void;
}

export function AiProvidersTab({
  aiSettings,
  setAiSettings,
  aiSaving,
  aiSaveMsg,
  showKimiKey,
  setShowKimiKey,
  showCopilotKey,
  setShowCopilotKey,
  showZaiKey,
  setShowZaiKey,
  opencodeInPath,
  crawlLoading,
  crawlFound,
  crawlError,
  crawlSelected,
  setCrawlSelected,
  setCrawlFound,
  saveAiSettings,
  crawlOpencode,
  applyCrawledKeys,
}: AiProvidersTabProps) {
  return (
    <div className="flex-1 overflow-auto pb-6">
      <Section title="AI Providers" icon={<Bot className="w-4 h-4" />}>
        <p className="text-xs text-muted-foreground mb-4">
          Configure API keys and select which AI provider and model to use
          for the agent and LLM API server. Changes take effect immediately
          — no restart required.
        </p>

        {/* Provider + Model selectors */}
        <div className="flex gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Active Provider
            </label>
            <select
              value={aiSettings.activeProvider}
              onChange={(e) => {
                const provider = e.target.value as AiProvider;
                const models = PROVIDER_MODELS[provider];
                setAiSettings((s) => ({
                  ...s,
                  activeProvider: provider,
                  activeModel: models[0]?.value ?? "",
                }));
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-muted-foreground">
              Active Model
            </label>
            <select
              value={aiSettings.activeModel}
              onChange={(e) =>
                setAiSettings((s) => ({
                  ...s,
                  activeModel: e.target.value,
                }))
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {PROVIDER_MODELS[aiSettings.activeProvider]?.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* API Keys */}
        <div className="space-y-3 mb-4">
          {/* Kimi */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Kimi API Key
            </label>
            <div className="relative">
              <Input
                type={showKimiKey ? "text" : "password"}
                value={aiSettings.kimiApiKey}
                onChange={(e) =>
                  setAiSettings((s) => ({
                    ...s,
                    kimiApiKey: e.target.value,
                  }))
                }
                className="h-8 text-xs font-mono pr-8"
                placeholder="sk-kimi-…"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKimiKey((v) => !v)}
              >
                {showKimiKey ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* GitHub Copilot */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              GitHub Copilot Token
            </label>
            <div className="relative">
              <Input
                type={showCopilotKey ? "text" : "password"}
                value={aiSettings.copilotApiKey}
                onChange={(e) =>
                  setAiSettings((s) => ({
                    ...s,
                    copilotApiKey: e.target.value,
                  }))
                }
                className="h-8 text-xs font-mono pr-8"
                placeholder="gho_…"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCopilotKey((v) => !v)}
              >
                {showCopilotKey ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* ZAI */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              ZAI / GLM-5 API Key
            </label>
            <div className="relative">
              <Input
                type={showZaiKey ? "text" : "password"}
                value={aiSettings.zaiApiKey}
                onChange={(e) =>
                  setAiSettings((s) => ({
                    ...s,
                    zaiApiKey: e.target.value,
                  }))
                }
                className="h-8 text-xs font-mono pr-8"
                placeholder="your-zhipuai-key…"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowZaiKey((v) => !v)}
              >
                {showZaiKey ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Codex CLI path */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Codex CLI Path
              {aiSettings.codexPath && (
                <span className="ml-2 text-green-400">(detected)</span>
              )}
            </label>
            <Input
              type="text"
              value={aiSettings.codexPath}
              onChange={(e) =>
                setAiSettings((s) => ({ ...s, codexPath: e.target.value }))
              }
              className="h-8 text-xs font-mono"
              placeholder="/opt/homebrew/bin/codex (auto-detected if on PATH)"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-detect from common install locations. No
              API key needed — uses your Codex CLI login.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="h-8"
            onClick={saveAiSettings}
            disabled={aiSaving}
          >
            {aiSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={crawlOpencode}
            disabled={crawlLoading}
          >
            <ImportIcon className="w-3.5 h-3.5" />
            {crawlLoading ? "Reading..." : "Crawl from OpenCode"}
            {opencodeInPath && !crawlLoading && (
              <span className="ml-1 rounded-full bg-green-500/20 text-green-400 text-[10px] px-1.5 py-px leading-none">
                detected
              </span>
            )}
          </Button>
          {aiSaveMsg && (
            <span className="text-xs text-green-400">{aiSaveMsg}</span>
          )}
          {crawlError && (
            <span className="text-xs text-red-400">{crawlError}</span>
          )}
        </div>

        {/* Crawl preview (inline) */}
        {crawlFound && (
          <div className="mt-4 rounded border border-border p-4 bg-muted/20 space-y-3">
            <p className="text-xs font-medium">
              Found in ~/.local/share/opencode/auth.json — select which keys
              to import:
            </p>
            <div className="space-y-2">
              {crawlFound.kimiApiKey && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={crawlSelected.has("kimiApiKey")}
                    onChange={(e) =>
                      setCrawlSelected((s) => {
                        const next = new Set(s);
                        if (e.target.checked) next.add("kimiApiKey");
                        else next.delete("kimiApiKey");
                        return next;
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-muted-foreground">
                    Kimi API key:
                  </span>
                  <code className="font-mono">
                    {crawlFound.kimiApiKey.slice(0, 20)}…
                  </code>
                </label>
              )}
              {crawlFound.copilotApiKey && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={crawlSelected.has("copilotApiKey")}
                    onChange={(e) =>
                      setCrawlSelected((s) => {
                        const next = new Set(s);
                        if (e.target.checked) next.add("copilotApiKey");
                        else next.delete("copilotApiKey");
                        return next;
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-muted-foreground">
                    Copilot token:
                  </span>
                  <code className="font-mono">
                    {crawlFound.copilotApiKey.slice(0, 20)}…
                  </code>
                </label>
              )}
              {crawlFound.zaiApiKey && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={crawlSelected.has("zaiApiKey")}
                    onChange={(e) =>
                      setCrawlSelected((s) => {
                        const next = new Set(s);
                        if (e.target.checked) next.add("zaiApiKey");
                        else next.delete("zaiApiKey");
                        return next;
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-muted-foreground">
                    ZAI API key:
                  </span>
                  <code className="font-mono">
                    {crawlFound.zaiApiKey.slice(0, 20)}…
                  </code>
                </label>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={applyCrawledKeys}
                disabled={crawlSelected.size === 0}
              >
                Import selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setCrawlFound(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

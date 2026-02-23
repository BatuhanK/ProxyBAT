import type {
  AiProviderSettings,
  CertificateInfo,
  CrawledAiKeys,
  IgnoreRule,
  ProxySettings,
  SslRule,
} from "@shared/types";
import type { SystemProxyServiceStatus } from "@shared/ipc-contracts";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_AI_SETTINGS: AiProviderSettings = {
  activeProvider: "kimi",
  activeModel: "k2p5",
  kimiApiKey: "",
  copilotApiKey: "",
  zaiApiKey: "",
  codexPath: "",
};

export function useSettings() {
  const [settings, setSettings] = useState<ProxySettings>({
    port: 8080,
    host: "127.0.0.1",
    sslEnabled: true,
    workspaceDir: "",
    curlBinary: "curl",
  });
  const [rules, setRules] = useState<SslRule[]>([]);
  const [certInfo, setCertInfo] = useState<CertificateInfo | null>(null);
  const [certPemPath, setCertPemPath] = useState<string | null>(null);
  const [newPattern, setNewPattern] = useState("");
  const [portInput, setPortInput] = useState("8080");

  // Ignore rules
  const [ignoreRules, setIgnoreRules] = useState<IgnoreRule[]>([]);
  const [newIgnorePattern, setNewIgnorePattern] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [workspaceDirInput, setWorkspaceDirInput] = useState("");
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceSaveMsg, setWorkspaceSaveMsg] = useState("");
  const [curlBinaryInput, setCurlBinaryInput] = useState("curl");
  const [curlSaving, setCurlSaving] = useState(false);
  const [curlSaveMsg, setCurlSaveMsg] = useState("");

  // AI Provider settings
  const [aiSettings, setAiSettings] =
    useState<AiProviderSettings>(DEFAULT_AI_SETTINGS);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaveMsg, setAiSaveMsg] = useState("");
  const [showKimiKey, setShowKimiKey] = useState(false);
  const [showCopilotKey, setShowCopilotKey] = useState(false);
  const [showZaiKey, setShowZaiKey] = useState(false);

  // Crawl from OpenCode modal
  const [opencodeInPath, setOpencodeInPath] = useState(false);
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlFound, setCrawlFound] = useState<CrawledAiKeys | null>(null);
  const [crawlError, setCrawlError] = useState("");
  const [crawlSelected, setCrawlSelected] = useState<Set<keyof CrawledAiKeys>>(
    new Set(),
  );

  // System proxy state
  const [proxyServices, setProxyServices] = useState<
    SystemProxyServiceStatus[]
  >([]);
  const [proxyStatusLoading, setProxyStatusLoading] = useState(false);
  const [proxySetting, setProxySetting] = useState(false);
  const [proxyUnsetting, setProxyUnsetting] = useState(false);
  const [proxyMsg, setProxyMsg] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const settingsApi = window.api.settings as unknown as {
      get: () => Promise<{ settings: ProxySettings }>;
      getAi: () => Promise<{ settings: AiProviderSettings }>;
      crawlOpencode: () => Promise<{
        found: CrawledAiKeys;
        fileFound: boolean;
        error?: string;
      }>;
    };
    const [settingsRes, rulesRes, certRes, ignoreRes, aiRes] =
      await Promise.all([
        window.api.settings.get(),
        window.api.sslRule.list(),
        window.api.certificate.get(),
        (
          window.api as {
            ignoreRule: { list: () => Promise<{ rules: IgnoreRule[] }> };
          }
        ).ignoreRule.list(),
        settingsApi.getAi(),
      ]);
    setSettings(settingsRes.settings);
    setPortInput(String(settingsRes.settings.port));
    setWorkspaceDirInput(settingsRes.settings.workspaceDir ?? "");
    setCurlBinaryInput(settingsRes.settings.curlBinary ?? "curl");
    setRules(rulesRes.rules);
    setCertInfo(certRes.info);
    setCertPemPath(certRes.pemPath);
    setIgnoreRules(ignoreRes.rules);
    setAiSettings(aiRes.settings);

    // Probe whether opencode is on PATH (fire-and-forget, silent)
    try {
      const probe = await (
        window.api.settings as unknown as {
          crawlOpencode: () => Promise<{
            found: CrawledAiKeys;
            fileFound: boolean;
          }>;
        }
      ).crawlOpencode();
      setOpencodeInPath(probe.found.opencodeInPath ?? false);
    } catch {
      /* ignore */
    }
    loadSystemProxyStatus();
  };

  const loadSystemProxyStatus = useCallback(async () => {
    setProxyStatusLoading(true);
    try {
      const res = await window.api.systemProxy.getStatus();
      setProxyServices(
        (res as { services: SystemProxyServiceStatus[] }).services ?? [],
      );
    } finally {
      setProxyStatusLoading(false);
    }
  }, []);

  const setSystemProxy = async () => {
    setProxySetting(true);
    setProxyMsg("");
    try {
      const port = parseInt(portInput, 10) || settings.port;
      const res = (await window.api.systemProxy.set({
        port,
        host: settings.host,
      })) as { success: boolean; error?: string };
      if (res.success) {
        setProxyMsg("System proxy set");
        await loadSystemProxyStatus();
      } else {
        setProxyMsg(res.error ?? "Failed to set proxy");
      }
    } finally {
      setProxySetting(false);
      setTimeout(() => setProxyMsg(""), 3000);
    }
  };

  const unsetSystemProxy = async () => {
    setProxyUnsetting(true);
    setProxyMsg("");
    try {
      const res = (await window.api.systemProxy.unset()) as {
        success: boolean;
        error?: string;
      };
      if (res.success) {
        setProxyMsg("System proxy unset");
        await loadSystemProxyStatus();
      } else {
        setProxyMsg(res.error ?? "Failed to unset proxy");
      }
    } finally {
      setProxyUnsetting(false);
      setTimeout(() => setProxyMsg(""), 3000);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    const port = parseInt(portInput, 10);
    if (!isNaN(port) && port > 0 && port < 65536) {
      await window.api.settings.update({ settings: { ...settings, port } });
      setSettings((s) => ({ ...s, port }));
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(""), 2000);
    }
    setSaving(false);
  };

  const browseWorkspaceDir = async () => {
    const result = await (
      window.api.settings as {
        pickFolder: () => Promise<{ path: string | null }>;
      }
    ).pickFolder();
    if (result.path) {
      setWorkspaceDirInput(result.path);
    }
  };

  const saveWorkspaceDir = async () => {
    const dir = workspaceDirInput.trim();
    if (!dir) return;
    setWorkspaceSaving(true);
    await window.api.settings.update({ settings: { workspaceDir: dir } });
    setSettings((s) => ({ ...s, workspaceDir: dir }));
    setWorkspaceSaveMsg("Saved");
    setTimeout(() => setWorkspaceSaveMsg(""), 2000);
    setWorkspaceSaving(false);
  };

  const saveCurlBinary = async () => {
    const binary = curlBinaryInput.trim();
    if (!binary) return;
    setCurlSaving(true);
    await window.api.settings.update({ settings: { curlBinary: binary } });
    setSettings((s) => ({ ...s, curlBinary: binary }));
    setCurlSaveMsg("Saved");
    setTimeout(() => setCurlSaveMsg(""), 2000);
    setCurlSaving(false);
  };

  // AI Provider handlers
  const saveAiSettings = async () => {
    setAiSaving(true);
    const api = window.api.settings as unknown as {
      updateAi: (params: {
        settings: Partial<AiProviderSettings>;
      }) => Promise<{ success: boolean }>;
    };
    await api.updateAi({ settings: aiSettings });
    setAiSaveMsg("Saved");
    setTimeout(() => setAiSaveMsg(""), 2000);
    setAiSaving(false);
  };

  const crawlOpencode = async () => {
    setCrawlLoading(true);
    setCrawlError("");
    setCrawlFound(null);
    try {
      const api = window.api.settings as unknown as {
        crawlOpencode: () => Promise<{
          found: CrawledAiKeys;
          fileFound: boolean;
          error?: string;
        }>;
      };
      const res = await api.crawlOpencode();
      if (res.found.opencodeInPath !== undefined)
        setOpencodeInPath(res.found.opencodeInPath);
      if (!res.fileFound) {
        setCrawlError(
          res.found.opencodeInPath
            ? "opencode found on PATH but auth.json is missing — try logging in with `opencode auth`"
            : "~/.local/share/opencode/auth.json not found",
        );
      } else if (res.error) {
        setCrawlError(res.error);
      } else {
        const found = res.found;
        if (!found.kimiApiKey && !found.copilotApiKey && !found.zaiApiKey) {
          setCrawlError("No known AI provider keys found in auth.json");
        } else {
          setCrawlFound(found);
          const selected = new Set<keyof CrawledAiKeys>();
          if (found.kimiApiKey) selected.add("kimiApiKey");
          if (found.copilotApiKey) selected.add("copilotApiKey");
          if (found.zaiApiKey) selected.add("zaiApiKey");
          setCrawlSelected(selected);
        }
      }
    } catch (err) {
      setCrawlError(String(err));
    } finally {
      setCrawlLoading(false);
    }
  };

  const applyCrawledKeys = async () => {
    if (!crawlFound) return;
    const patch: Partial<AiProviderSettings> = {};
    if (crawlSelected.has("kimiApiKey") && crawlFound.kimiApiKey)
      patch.kimiApiKey = crawlFound.kimiApiKey;
    if (crawlSelected.has("copilotApiKey") && crawlFound.copilotApiKey)
      patch.copilotApiKey = crawlFound.copilotApiKey;
    if (crawlSelected.has("zaiApiKey") && crawlFound.zaiApiKey)
      patch.zaiApiKey = crawlFound.zaiApiKey;
    setAiSettings((s) => ({ ...s, ...patch }));
    setCrawlFound(null);
    setCrawlSelected(new Set());
  };

  // SSL Rule handlers
  const addRule = async () => {
    const pattern = newPattern.trim();
    if (!pattern) return;
    const result = await window.api.sslRule.create({ pattern, enabled: true });
    setRules((r) => [...r, result.rule]);
    setNewPattern("");
  };

  const toggleRule = async (rule: SslRule) => {
    await window.api.sslRule.update({ id: rule.id, enabled: !rule.enabled });
    setRules((r) =>
      r.map((x) => (x.id === rule.id ? { ...x, enabled: !x.enabled } : x)),
    );
  };

  const deleteRule = async (id: string) => {
    await window.api.sslRule.delete({ id });
    setRules((r) => r.filter((x) => x.id !== id));
  };

  // Certificate handlers
  const exportCert = async () => {
    if (!certPemPath) return;
    await window.api.certificate.export({ targetPath: certPemPath });
  };

  const regenerateCert = async () => {
    const result = await window.api.certificate.regenerate();
    if (result.success && result.info) {
      setCertInfo(result.info);
    }
  };

  // Ignore rule handlers
  const ignoreApi = (
    window.api as {
      ignoreRule: {
        list: () => Promise<{ rules: IgnoreRule[] }>;
        create: (p: {
          pattern: string;
          enabled?: boolean;
        }) => Promise<{ rule: IgnoreRule }>;
        update: (p: {
          id: string;
          enabled?: boolean;
          pattern?: string;
        }) => Promise<{ success: boolean }>;
        delete: (p: { id: string }) => Promise<{ success: boolean }>;
      };
    }
  ).ignoreRule;

  const addIgnoreRule = async () => {
    const pattern = newIgnorePattern.trim();
    if (!pattern) return;
    const result = await ignoreApi.create({ pattern, enabled: true });
    setIgnoreRules((r) => [...r, result.rule]);
    setNewIgnorePattern("");
  };

  const toggleIgnoreRule = async (rule: IgnoreRule) => {
    await ignoreApi.update({ id: rule.id, enabled: !rule.enabled });
    setIgnoreRules((r) =>
      r.map((x) => (x.id === rule.id ? { ...x, enabled: !x.enabled } : x)),
    );
  };

  const deleteIgnoreRule = async (id: string) => {
    await ignoreApi.delete({ id });
    setIgnoreRules((r) => r.filter((x) => x.id !== id));
  };

  return {
    // State
    settings,
    rules,
    certInfo,
    certPemPath,
    newPattern,
    portInput,
    ignoreRules,
    newIgnorePattern,
    saving,
    saveMsg,
    workspaceDirInput,
    workspaceSaving,
    workspaceSaveMsg,
    curlBinaryInput,
    curlSaving,
    curlSaveMsg,
    aiSettings,
    aiSaving,
    aiSaveMsg,
    showKimiKey,
    showCopilotKey,
    showZaiKey,
    opencodeInPath,
    crawlLoading,
    crawlFound,
    crawlError,
    crawlSelected,
    proxyServices,
    proxyStatusLoading,
    proxySetting,
    proxyUnsetting,
    proxyMsg,

    // Setters
    setSettings,
    setNewPattern,
    setPortInput,
    setNewIgnorePattern,
    setWorkspaceDirInput,
    setCurlBinaryInput,
    setAiSettings,
    setShowKimiKey,
    setShowCopilotKey,
    setShowZaiKey,
    setCrawlSelected,
    setCrawlFound,

    // Actions
    loadSystemProxyStatus,
    setSystemProxy,
    unsetSystemProxy,
    saveSettings,
    browseWorkspaceDir,
    saveWorkspaceDir,
    saveCurlBinary,
    saveAiSettings,
    crawlOpencode,
    applyCrawledKeys,
    addRule,
    toggleRule,
    deleteRule,
    exportCert,
    regenerateCert,
    addIgnoreRule,
    toggleIgnoreRule,
    deleteIgnoreRule,
  };
}

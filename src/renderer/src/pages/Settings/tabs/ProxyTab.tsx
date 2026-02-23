import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { Switch } from "@renderer/components/ui/switch";
import { cn } from "@renderer/lib/utils";
import type { IgnoreRule, ProxySettings, SslRule } from "@shared/types";
import type { SystemProxyServiceStatus } from "@shared/ipc-contracts";
import { Filter, Globe, Plus, RefreshCw, Shield } from "lucide-react";
import {
  Section,
  RuleList,
  RuleRow,
  DeleteButton,
} from "../components";

interface ProxyTabProps {
  settings: { host: string };
  portInput: string;
  setPortInput: (value: string) => void;
  setSettings: (fn: (s: ProxySettings) => ProxySettings) => void;
  saving: boolean;
  saveMsg: string;
  saveSettings: () => void;
  rules: SslRule[];
  newPattern: string;
  setNewPattern: (value: string) => void;
  addRule: () => void;
  toggleRule: (rule: SslRule) => void;
  deleteRule: (id: string) => void;
  ignoreRules: IgnoreRule[];
  newIgnorePattern: string;
  setNewIgnorePattern: (value: string) => void;
  addIgnoreRule: () => void;
  toggleIgnoreRule: (rule: IgnoreRule) => void;
  deleteIgnoreRule: (id: string) => void;
  proxyServices: SystemProxyServiceStatus[];
  proxyStatusLoading: boolean;
  proxySetting: boolean;
  proxyUnsetting: boolean;
  proxyMsg: string;
  setSystemProxy: () => void;
  unsetSystemProxy: () => void;
  loadSystemProxyStatus: () => void;
}

export function ProxyTab({
  settings,
  portInput,
  setPortInput,
  setSettings,
  saving,
  saveMsg,
  saveSettings,
  rules,
  newPattern,
  setNewPattern,
  addRule,
  toggleRule,
  deleteRule,
  ignoreRules,
  newIgnorePattern,
  setNewIgnorePattern,
  addIgnoreRule,
  toggleIgnoreRule,
  deleteIgnoreRule,
  proxyServices,
  proxyStatusLoading,
  proxySetting,
  proxyUnsetting,
  proxyMsg,
  setSystemProxy,
  unsetSystemProxy,
  loadSystemProxyStatus,
}: ProxyTabProps) {
  return (
    <div className="flex-1 overflow-auto pb-6">
      <Section title="Configuration">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Listen Port
            </label>
            <Input
              value={portInput}
              onChange={(e) => setPortInput(e.target.value)}
              className="w-28 h-8 text-sm font-mono"
              placeholder="8080"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Host</label>
            <Input
              value={settings.host}
              onChange={(e) =>
                setSettings((s) => ({ ...s, host: e.target.value }))
              }
              className="w-36 h-8 text-sm font-mono"
              placeholder="127.0.0.1"
            />
          </div>
          <Button
            size="sm"
            onClick={saveSettings}
            disabled={saving}
            className="h-8"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
          {saveMsg && (
            <span className="text-xs text-green-400">{saveMsg}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Configure your browser or system to use HTTP proxy at the address
          above. Changes take effect on next proxy start.
        </p>
      </Section>

      <Section
        title="SSL Intercept Rules"
        icon={<Shield className="w-4 h-4" />}
      >
        <p className="text-xs text-muted-foreground mb-3">
          Define glob patterns for domains to intercept SSL traffic. Use{" "}
          <code className="bg-muted px-1 rounded">*.example.com</code> or{" "}
          <code className="bg-muted px-1 rounded">api.example.com</code>.
        </p>
        <div className="flex gap-2 mb-3">
          <Input
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="*.example.com"
            className="flex-1 h-8 text-sm font-mono"
            onKeyDown={(e) => e.key === "Enter" && addRule()}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addRule}
            className="h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
        {rules.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No rules yet. Add a pattern to start intercepting SSL.
          </p>
        ) : (
          <RuleList>
            {rules.map((rule, i) => (
              <RuleRow key={rule.id} striped={i % 2 === 0}>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => toggleRule(rule)}
                />
                <span
                  className={cn(
                    "flex-1 font-mono text-xs",
                    !rule.enabled && "text-muted-foreground line-through",
                  )}
                >
                  {rule.pattern}
                </span>
                <Badge
                  variant={rule.enabled ? "default" : "secondary"}
                  className="text-xs py-0"
                >
                  {rule.enabled ? "active" : "off"}
                </Badge>
                <DeleteButton onClick={() => deleteRule(rule.id)} />
              </RuleRow>
            ))}
          </RuleList>
        )}
      </Section>

      <Section title="Ignore Rules" icon={<Filter className="w-4 h-4" />}>
        <p className="text-xs text-muted-foreground mb-3">
          Requests matching these wildcard patterns are silently dropped and
          never recorded. Use{" "}
          <code className="bg-muted px-1 rounded">*.google.com/*</code>,{" "}
          <code className="bg-muted px-1 rounded">*/favicon.ico</code>, or
          any URL wildcard.
        </p>
        <div className="flex gap-2 mb-3">
          <Input
            value={newIgnorePattern}
            onChange={(e) => setNewIgnorePattern(e.target.value)}
            placeholder="*.example.com/* or */tracking/*"
            className="flex-1 h-8 text-sm font-mono"
            onKeyDown={(e) => e.key === "Enter" && addIgnoreRule()}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addIgnoreRule}
            className="h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
        {ignoreRules.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No ignore rules. All requests will be captured.
          </p>
        ) : (
          <RuleList>
            {ignoreRules.map((rule, i) => (
              <RuleRow key={rule.id} striped={i % 2 === 0}>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => toggleIgnoreRule(rule)}
                />
                <span
                  className={cn(
                    "flex-1 font-mono text-xs",
                    !rule.enabled && "text-muted-foreground line-through",
                  )}
                >
                  {rule.pattern}
                </span>
                <Badge
                  variant={rule.enabled ? "default" : "secondary"}
                  className="text-xs py-0"
                >
                  {rule.enabled ? "active" : "off"}
                </Badge>
                <DeleteButton onClick={() => deleteIgnoreRule(rule.id)} />
              </RuleRow>
            ))}
          </RuleList>
        )}
      </Section>

      <Section title="System Proxy" icon={<Globe className="w-4 h-4" />}>
        <p className="text-xs text-muted-foreground mb-3">
          Configure macOS to route all traffic through ProxyBat. Applies to
          all eligible network services.
        </p>
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            className="h-8"
            onClick={setSystemProxy}
            disabled={proxySetting || proxyUnsetting || proxyStatusLoading}
          >
            {proxySetting ? "Setting..." : "Set System Proxy"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-400 border-red-400/30 hover:text-red-300"
            onClick={unsetSystemProxy}
            disabled={proxySetting || proxyUnsetting || proxyStatusLoading}
          >
            {proxyUnsetting ? "Unsetting..." : "Unset System Proxy"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={loadSystemProxyStatus}
            disabled={proxyStatusLoading}
            title="Refresh status"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5",
                proxyStatusLoading && "animate-spin",
              )}
            />
          </Button>
          {proxyMsg && (
            <span
              className={cn(
                "text-xs self-center",
                proxyMsg.includes("Failed")
                  ? "text-red-400"
                  : "text-green-400",
              )}
            >
              {proxyMsg}
            </span>
          )}
        </div>
        {proxyStatusLoading && proxyServices.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Loading...</p>
        ) : proxyServices.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No eligible network services found.
          </p>
        ) : (
          <RuleList>
            {proxyServices.map((svc, i) => {
              const active = svc.httpEnabled || svc.httpsEnabled;
              const displayHost = svc.httpEnabled
                ? svc.httpHost
                : svc.httpsHost;
              const displayPort = svc.httpEnabled
                ? svc.httpPort
                : svc.httpsPort;
              return (
                <RuleRow key={svc.service} striped={i % 2 === 0}>
                  <span className="flex-1 font-mono text-xs">
                    {svc.service}
                  </span>
                  {active && displayHost && displayPort ? (
                    <span className="text-xs text-muted-foreground font-mono">
                      {displayHost}:{displayPort}
                    </span>
                  ) : null}
                  <Badge
                    variant={active ? "default" : "secondary"}
                    className="text-xs py-0"
                  >
                    {active ? "active" : "off"}
                  </Badge>
                </RuleRow>
              );
            })}
          </RuleList>
        )}
      </Section>
    </div>
  );
}

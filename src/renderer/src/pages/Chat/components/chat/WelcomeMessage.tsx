import { Bot, Network, Activity, Globe, Clock, Shield, Loader2 } from "lucide-react";
import { cn } from "@renderer/lib/utils";
import type { AgentRole } from "@renderer/store/agentStore";
import type { SessionSummary, HttpRequest, ProxySession } from "@shared/types";
import { ROLE_META } from "../../constants/roleMeta";

interface WelcomeMessageProps {
  role: AgentRole;
  onSend: (message: string) => void;
  linkedProxy?: ProxySession | null;
  proxySummary?: SessionSummary | null;
  proxyRequests?: HttpRequest[];
  proxyLoading?: boolean;
}

export function WelcomeMessage({
  role,
  onSend,
  linkedProxy,
  proxySummary,
  proxyRequests = [],
  proxyLoading = false,
}: WelcomeMessageProps) {
  const meta = ROLE_META[role];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold mb-1">{meta.label}</h2>
        <p className="text-xs text-muted-foreground max-w-xs">
          {meta.description}
        </p>
      </div>

      {/* Proxy session preview */}
      {linkedProxy && (
        <div className="w-full max-w-xs rounded-lg border border-border bg-muted/20 text-left overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/60">
            <Network className="w-3 h-3 text-primary/70 flex-shrink-0" />
            <span className="text-xs font-medium truncate">{linkedProxy.name}</span>
            {linkedProxy.status === "active" && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            )}
          </div>

          {proxyLoading ? (
            <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <div className="px-3 py-2 space-y-2">
              {proxySummary && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Activity className="w-2.5 h-2.5" />
                    <span>{proxySummary.totalRequests} requests</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Globe className="w-2.5 h-2.5" />
                    <span>{proxySummary.domains.length} domains</span>
                  </div>
                  {proxySummary.avgDurationMs != null && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{Math.round(proxySummary.avgDurationMs)}ms avg</span>
                    </div>
                  )}
                  {proxySummary.errorCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400">
                      <Shield className="w-2.5 h-2.5" />
                      <span>{proxySummary.errorCount} errors</span>
                    </div>
                  )}
                </div>
              )}

              {proxyRequests.length > 0 && (
                <div className="space-y-0.5 border-t border-border/40 pt-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Last requests
                  </p>
                  {proxyRequests.map((req) => (
                    <div key={req.id} className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "font-mono text-[10px] w-9 flex-shrink-0 text-right",
                          req.statusCode && req.statusCode >= 500
                            ? "text-red-400"
                            : req.statusCode && req.statusCode >= 400
                              ? "text-orange-400"
                              : req.statusCode && req.statusCode >= 300
                                ? "text-yellow-400"
                                : "text-green-400",
                        )}
                      >
                        {req.statusCode ?? "—"}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[10px] w-10 flex-shrink-0",
                          req.method === "POST"
                            ? "text-orange-400"
                            : req.method === "PUT" || req.method === "PATCH"
                              ? "text-yellow-400"
                              : req.method === "DELETE"
                                ? "text-red-400"
                                : "text-blue-400",
                        )}
                      >
                        {req.method}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {req.path}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!proxySummary && proxyRequests.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">No traffic captured yet</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5 w-full max-w-xs">
        {meta.examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onSend(ex)}
            className="text-xs text-left px-3 py-2 rounded border border-border hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

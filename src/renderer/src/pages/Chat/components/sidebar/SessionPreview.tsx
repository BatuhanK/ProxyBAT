import { cn } from "@renderer/lib/utils";
import {
  Activity,
  Globe,
  Shield,
  Clock,
  Network,
  X,
  Loader2,
} from "lucide-react";
import type { HttpRequest, SessionSummary, ProxySession } from "@shared/types";
import type { ChatSessionSummary } from "@renderer/store/agentStore";
import { StatChip } from "../common/StatChip";

interface SessionPreviewProps {
  chatSession: ChatSessionSummary;
  summary: SessionSummary | null;
  requests: HttpRequest[];
  loading: boolean;
  linkedProxy: ProxySession | null;
  onClose: () => void;
}

export function SessionPreview({
  chatSession,
  summary,
  requests,
  loading,
  linkedProxy,
  onClose,
}: SessionPreviewProps) {
  return (
    <div className="border-t border-border flex flex-col max-h-72 overflow-hidden bg-card/50">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 flex-shrink-0">
        <span className="text-xs font-medium truncate">
          {chatSession.title}
        </span>
        <button
          className="text-muted-foreground hover:text-foreground ml-1 flex-shrink-0"
          onClick={onClose}
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-auto flex-1 px-3 py-2 space-y-2 text-xs">
        {loading ? (
          <div className="flex items-center gap-1.5 text-muted-foreground py-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : !chatSession.linkedProxySessionId ? (
          <p className="text-muted-foreground italic">No linked proxy session</p>
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-2 gap-1 mb-2">
                <StatChip
                  icon={<Activity className="w-2.5 h-2.5" />}
                  label={`${summary.totalRequests} requests`}
                />
                <StatChip
                  icon={<Globe className="w-2.5 h-2.5" />}
                  label={`${summary.domains.length} domains`}
                />
                {summary.errorCount > 0 && (
                  <StatChip
                    icon={<Shield className="w-2.5 h-2.5 text-red-400" />}
                    label={`${summary.errorCount} errors`}
                    className="text-red-400"
                  />
                )}
                {summary.avgDurationMs != null && (
                  <StatChip
                    icon={<Clock className="w-2.5 h-2.5" />}
                    label={`${Math.round(summary.avgDurationMs)}ms avg`}
                  />
                )}
              </div>
            )}

            {linkedProxy && (
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Network className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{linkedProxy.name}</span>
                {linkedProxy.status === "active" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                )}
              </div>
            )}

            {requests.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
                  Last requests
                </p>
                {requests.map((req) => (
                  <div key={req.id} className="flex items-center gap-1.5 py-0.5">
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

            {requests.length === 0 && !loading && (
              <p className="text-muted-foreground italic">No requests captured</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

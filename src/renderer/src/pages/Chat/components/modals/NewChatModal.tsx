import { useRef, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import { ROLE_META } from "../../constants/roleMeta";
import type { AgentRole } from "@renderer/store/agentStore";
import type { ProxySession } from "@shared/types";

interface NewChatModalProps {
  proxySessions: ProxySession[];
  selectedProxyId: string | null;
  onSelectProxy: (id: string | null) => void;
  onPickRole: (role: AgentRole) => void;
  onClear: () => void;
  onClose: () => void;
}

export function NewChatModal({
  proxySessions,
  selectedProxyId,
  onSelectProxy,
  onPickRole,
  onClear,
  onClose,
}: NewChatModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-[420px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold">New Chat</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose a role and optionally link a proxy session
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Link proxy session
            </label>
            <select
              value={selectedProxyId ?? ""}
              onChange={(e) => onSelectProxy(e.target.value || null)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">None</option>
              {proxySessions.map((ps) => (
                <option key={ps.id} value={ps.id}>
                  {ps.name}
                  {ps.status === "active" ? " ●" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Select role
            </label>
            <div className="space-y-1.5">
              {(Object.entries(ROLE_META) as [AgentRole, typeof ROLE_META["general"]][]).map(
                ([role, m]) => (
                  <button
                    key={role}
                    onClick={() => onPickRole(role)}
                    className="flex items-start gap-3 w-full px-3 py-2.5 rounded-lg border border-border hover:border-border/80 hover:bg-muted/40 transition-colors text-left group"
                  >
                    <div className="mt-0.5 flex-shrink-0">{m.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{m.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                        {m.description}
                      </p>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear current chat
          </button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

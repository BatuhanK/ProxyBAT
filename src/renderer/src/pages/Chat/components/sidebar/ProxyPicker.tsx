import { cn } from "@renderer/lib/utils";
import { Network, ChevronDown } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import type { ProxySession } from "@shared/types";

interface ProxyPickerProps {
  currentSessionId: string;
  currentLinkedProxyId: string | null;
  currentLinkedProxy: ProxySession | null;
  proxySessions: ProxySession[];
  onUpdateSessionProxy: (sessionId: string, proxyId: string | null) => void;
}

export function ProxyPicker({
  currentSessionId,
  currentLinkedProxyId,
  currentLinkedProxy,
  proxySessions,
  onUpdateSessionProxy,
}: ProxyPickerProps) {
  const [showProxyPicker, setShowProxyPicker] = useState(false);
  const proxyPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        proxyPickerRef.current &&
        !proxyPickerRef.current.contains(e.target as Node)
      ) {
        setShowProxyPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={proxyPickerRef}>
      <button
        onClick={() => setShowProxyPicker((v) => !v)}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
          "border border-border/60 hover:border-border hover:bg-muted/30",
          currentLinkedProxy ? "text-primary/80" : "text-muted-foreground",
        )}
        title="Change linked proxy session"
      >
        <Network className="w-3 h-3" />
        <span className="max-w-[100px] truncate">
          {currentLinkedProxy ? currentLinkedProxy.name : "No session"}
        </span>
        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
      </button>

      {showProxyPicker && (
        <div className="absolute right-0 top-8 z-50 w-52 rounded-md border border-border bg-popover shadow-md py-1 max-h-64 overflow-auto">
          <div className="px-3 py-1 text-xs text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
            Link proxy session
          </div>
          <button
            onClick={() => {
              onUpdateSessionProxy(currentSessionId, null);
              setShowProxyPicker(false);
            }}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted/40 transition-colors text-left",
              !currentLinkedProxyId && "text-primary",
            )}
          >
            <span className="opacity-50">None</span>
          </button>
          {proxySessions.map((ps) => (
            <button
              key={ps.id}
              onClick={() => {
                onUpdateSessionProxy(currentSessionId, ps.id);
                setShowProxyPicker(false);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted/40 transition-colors text-left",
                currentLinkedProxyId === ps.id && "text-primary",
              )}
            >
              <Network className="w-3 h-3 flex-shrink-0 opacity-60" />
              <span className="truncate">{ps.name}</span>
              {ps.status === "active" && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { cn } from "@renderer/lib/utils";
import { PanelRight, RotateCcw } from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import { Badge } from "@renderer/components/ui/badge";
import { ProxyPicker } from "../sidebar/ProxyPicker";
import { ROLE_META } from "../../constants/roleMeta";
import type { ProxySession } from "@shared/types";
import type { AgentRole } from "@renderer/store/agentStore";

interface ChatHeaderProps {
  currentTitle: string;
  currentRole: AgentRole;
  currentSessionId: string | null;
  currentLinkedProxyId: string | null;
  currentLinkedProxy: ProxySession | null;
  proxySessions: ProxySession[];
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
  onNewChat: () => void;
  onUpdateSessionProxy: (sessionId: string, proxyId: string | null) => void;
}

export function ChatHeader({
  currentTitle,
  currentRole,
  currentSessionId,
  currentLinkedProxyId,
  currentLinkedProxy,
  proxySessions,
  showRightPanel,
  onToggleRightPanel,
  onNewChat,
  onUpdateSessionProxy,
}: ChatHeaderProps) {
  const meta = ROLE_META[currentRole];

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {meta.icon}
        <span className="text-sm font-semibold truncate">{currentTitle}</span>
        <Badge
          variant="outline"
          className={cn("text-xs py-0 flex-shrink-0", meta.badgeClass)}
        >
          {meta.shortLabel}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        {currentSessionId && (
          <ProxyPicker
            currentSessionId={currentSessionId}
            currentLinkedProxyId={currentLinkedProxyId}
            currentLinkedProxy={currentLinkedProxy}
            proxySessions={proxySessions}
            onUpdateSessionProxy={onUpdateSessionProxy}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 flex-shrink-0",
            showRightPanel
              ? "text-foreground bg-muted/40"
              : "text-muted-foreground",
          )}
          onClick={onToggleRightPanel}
          title="Toggle workspace panel"
        >
          <PanelRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground flex-shrink-0"
          onClick={onNewChat}
          title="Clear conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

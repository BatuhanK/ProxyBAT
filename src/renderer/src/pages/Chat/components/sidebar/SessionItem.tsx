import { cn } from "@renderer/lib/utils";
import { Trash2, Network } from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import { ROLE_META } from "../../constants/roleMeta";
import type { ChatSessionSummary } from "@renderer/store/agentStore";

interface SessionItemProps {
  session: ChatSessionSummary;
  active: boolean;
  previewed: boolean;
  proxyName?: string;
  onSelect: () => void;
  onDelete: () => void;
}

export function SessionItem({
  session,
  active,
  previewed,
  proxyName,
  onSelect,
  onDelete,
}: SessionItemProps) {
  const meta = ROLE_META[session.role];

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/40",
        active && "bg-primary/10",
        previewed && !active && "bg-muted/20",
      )}
    >
      <div className="flex-shrink-0">{meta.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{session.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {proxyName ? (
            <span className="flex items-center gap-0.5">
              <Network className="w-2.5 h-2.5 inline" />
              {proxyName}
            </span>
          ) : (
            new Date(session.updatedAt).toLocaleDateString()
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

import { Plus } from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import { SessionItem } from "./SessionItem";
import { SessionPreview } from "./SessionPreview";
import type { ChatSessionSummary } from "@renderer/store/agentStore";
import type { ProxySession } from "@shared/types";

interface SidebarProps {
  sessions: ChatSessionSummary[];
  proxySessions: ProxySession[];
  currentSessionId: string | null;
  previewSessionId: string | null;
  previewSummary: any;
  previewRequests: any[];
  previewLoading: boolean;
  previewChatSession?: ChatSessionSummary;
  previewLinkedProxy?: ProxySession;
  width: number;
  onNewChat: () => void;
  onSelectSession: (session: ChatSessionSummary) => void;
  onDeleteSession: (id: string) => void;
  onClearPreview: () => void;
  onStartDrag: (e: React.MouseEvent) => void;
}

export function Sidebar({
  sessions,
  proxySessions,
  currentSessionId,
  previewSessionId,
  previewSummary,
  previewRequests,
  previewLoading,
  previewChatSession,
  previewLinkedProxy,
  width,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onClearPreview,
  onStartDrag,
}: SidebarProps) {
  return (
    <div
      className="flex-shrink-0 border-r border-border flex flex-col relative"
      style={{ width }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Chats
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onNewChat}
          title="New chat"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {sessions.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center mt-4 opacity-60">
            No conversations yet
          </div>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              active={session.id === currentSessionId}
              previewed={session.id === previewSessionId}
              proxyName={
                proxySessions.find(
                  (p) => p.id === session.linkedProxySessionId,
                )?.name
              }
              onSelect={() => onSelectSession(session)}
              onDelete={() => onDeleteSession(session.id)}
            />
          ))
        )}
      </div>

      {previewSessionId && previewChatSession && (
        <SessionPreview
          chatSession={previewChatSession}
          summary={previewSummary}
          requests={previewRequests}
          loading={previewLoading}
          linkedProxy={previewLinkedProxy || null}
          onClose={onClearPreview}
        />
      )}

      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/40 transition-colors z-10"
        onMouseDown={onStartDrag}
      />
    </div>
  );
}

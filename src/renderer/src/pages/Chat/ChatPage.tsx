import { useEffect, useState } from "react";
import { useLocalStorage } from "@renderer/lib/useLocalStorage";
import {
  useAgentStore,
  type AgentRole,
} from "@renderer/store/agentStore";
import { useProxyStore } from "@renderer/store/proxyStore";
import { useSessionStore } from "@renderer/store/sessionStore";
import { Sidebar } from "./components/sidebar/Sidebar";
import { ChatHeader } from "./components/chat/ChatHeader";
import { ChatTimeline } from "./components/chat/ChatTimeline";
import { ChatInput } from "./components/chat/ChatInput";
import { NewChatModal } from "./components/modals/NewChatModal";
import { RightPanel } from "./RightPanel";
import { useChatResizing } from "./hooks/useChatResizing";
import { useChatSidebar } from "./hooks/useChatSidebar";
import { useWelcomeProxy } from "./hooks/useWelcomeProxy";
import { ROLE_META } from "./constants/roleMeta";

export function ChatPage() {
  const {
    timeline,
    isThinking,
    currentSessionId,
    currentRole,
    sessions,
    sendMessage,
    reset,
    loadSession,
    deleteSession,
    fetchSessions,
    startSession,
    updateSessionProxy,
  } = useAgentStore();

  const { activeSessionId: proxySessionId } = useProxyStore();
  const { sessions: proxySessions } = useSessionStore();

  const [input, setInput] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedProxyForNew, setSelectedProxyForNew] = useState<string | null>(null);

  const {
    leftWidth,
    rightWidth,
    startLeftDrag,
    startRightDrag,
  } = useChatResizing();

  const {
    previewSessionId,
    previewSummary,
    previewRequests,
    previewLoading,
    previewChatSession,
    previewLinkedProxy,
    handleSelect,
    clearPreview,
  } = useChatSidebar(sessions, loadSession);

  const [openPanelSessions, setOpenPanelSessions] = useLocalStorage<string[]>(
    "ProxyBat:openPanelSessions",
    [],
  );

  const showRightPanel =
    !!currentSessionId && openPanelSessions.includes(currentSessionId);

  const setShowRightPanel = (open: boolean | ((v: boolean) => boolean)) => {
    if (!currentSessionId) return;
    const id = currentSessionId;
    setOpenPanelSessions((prev) => {
      const nextOpen =
        typeof open === "function" ? open(prev.includes(id)) : open;
      if (nextOpen) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((s) => s !== id);
    });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (proxySessionId) setSelectedProxyForNew(proxySessionId);
  }, [proxySessionId]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isThinking) return;
    setInput("");
    await sendMessage(msg, selectedProxyForNew ?? proxySessionId ?? undefined);
  };

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim() || isThinking) return;
    await sendMessage(msg, selectedProxyForNew ?? proxySessionId ?? undefined);
  };

  const handleNewChat = () => {
    reset();
  };

  const handlePickRole = async (role: AgentRole) => {
    setShowNewChatModal(false);
    await startSession(role, selectedProxyForNew ?? proxySessionId ?? undefined);
  };

  const currentChatSession = sessions.find((s) => s.id === currentSessionId);
  const currentLinkedProxyId = currentChatSession?.linkedProxySessionId ?? null;
  const currentLinkedProxy = proxySessions.find(
    (s) => s.id === currentLinkedProxyId,
  );

  const meta = ROLE_META[currentRole];
  const currentTitle =
    sessions.find((s) => s.id === currentSessionId)?.title ??
    (currentSessionId ? "Chat" : "New Chat");

  // Welcome screen proxy preview — only shown when no active chat session
  const welcomeProxyId = currentSessionId ? null : (selectedProxyForNew ?? proxySessionId ?? null);
  const {
    linkedProxy: welcomeLinkedProxy,
    summary: welcomeProxySummary,
    requests: welcomeProxyRequests,
    loading: welcomeProxyLoading,
  } = useWelcomeProxy(welcomeProxyId, proxySessions);

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        sessions={sessions}
        proxySessions={proxySessions}
        currentSessionId={currentSessionId}
        previewSessionId={previewSessionId}
        previewSummary={previewSummary}
        previewRequests={previewRequests}
        previewLoading={previewLoading}
        previewChatSession={previewChatSession}
        previewLinkedProxy={previewLinkedProxy ?? undefined}
        width={leftWidth}
        onNewChat={() => setShowNewChatModal(true)}
        onSelectSession={handleSelect}
        onDeleteSession={deleteSession}
        onClearPreview={clearPreview}
        onStartDrag={startLeftDrag}
      />

      <div className="flex-1 flex overflow-hidden min-w-0">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <ChatHeader
            currentTitle={currentTitle}
            currentRole={currentRole}
            currentSessionId={currentSessionId}
            currentLinkedProxyId={currentLinkedProxyId}
            currentLinkedProxy={currentLinkedProxy ?? null}
            proxySessions={proxySessions}
            showRightPanel={showRightPanel}
            onToggleRightPanel={() => setShowRightPanel((v) => !v)}
            onNewChat={handleNewChat}
            onUpdateSessionProxy={updateSessionProxy}
          />

          <ChatTimeline
            timeline={timeline}
            isThinking={isThinking}
            currentRole={currentRole}
            onSend={handleSendMessage}
            linkedProxy={welcomeLinkedProxy}
            proxySummary={welcomeProxySummary}
            proxyRequests={welcomeProxyRequests}
            proxyLoading={welcomeProxyLoading}
          />

          <ChatInput
            input={input}
            isThinking={isThinking}
            placeholder={meta.placeholder}
            description={meta.description}
            onChange={setInput}
            onSend={handleSend}
          />
        </div>

        <div
          className="flex-shrink-0 flex flex-col overflow-hidden relative"
          style={{
            width: showRightPanel ? rightWidth : 0,
            display: currentSessionId ? undefined : "none",
          }}
        >
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/40 transition-colors z-10"
            onMouseDown={startRightDrag}
          />
          <RightPanel
            sessionId={currentSessionId}
            allSessionIds={sessions.map((s) => s.id)}
            onClose={() => setShowRightPanel(false)}
          />
        </div>
      </div>

      {showNewChatModal && (
        <NewChatModal
          proxySessions={proxySessions}
          selectedProxyId={selectedProxyForNew}
          onSelectProxy={setSelectedProxyForNew}
          onPickRole={handlePickRole}
          onClear={() => { setShowNewChatModal(false); handleNewChat(); }}
          onClose={() => setShowNewChatModal(false)}
        />
      )}
    </div>
  );
}

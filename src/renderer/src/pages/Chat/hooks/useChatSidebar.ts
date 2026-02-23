import { useState } from "react";
import type { HttpRequest, SessionSummary } from "@shared/types";
import type { ChatSessionSummary } from "@renderer/store/agentStore";
import { useSessionStore } from "@renderer/store/sessionStore";

export function useChatSidebar(
  sessions: ChatSessionSummary[],
  loadSession: (id: string) => void,
) {
  const { sessions: proxySessions } = useSessionStore();
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [previewSummary, setPreviewSummary] = useState<SessionSummary | null>(null);
  const [previewRequests, setPreviewRequests] = useState<HttpRequest[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadPreview = async (chatSession: ChatSessionSummary) => {
    setPreviewSessionId(chatSession.id);
    const linkedId = chatSession.linkedProxySessionId;
    if (!linkedId) {
      setPreviewSummary(null);
      setPreviewRequests([]);
      return;
    }
    setPreviewLoading(true);
    try {
      const [summaryRes, requestsRes] = await Promise.all([
        (
          window.api as {
            session: {
              getSummary: (p: { sessionId: string }) => Promise<{ summary: SessionSummary | null }>;
            };
          }
        ).session.getSummary({ sessionId: linkedId }),
        (
          window.api as {
            request: {
              list: (p: { sessionId: string; limit: number }) => Promise<{ requests: HttpRequest[] }>;
            };
          }
        ).request.list({ sessionId: linkedId, limit: 10 }),
      ]);
      setPreviewSummary(summaryRes.summary);
      setPreviewRequests(requestsRes.requests);
    } finally {
      setPreviewLoading(false);
    }
  };

  const clearPreview = () => {
    setPreviewSessionId(null);
    setPreviewSummary(null);
    setPreviewRequests([]);
  };

  const handleSelect = (session: ChatSessionSummary) => {
    loadSession(session.id);
    loadPreview(session);
  };

  const previewChatSession = sessions.find((s) => s.id === previewSessionId);
  const previewLinkedProxy = previewChatSession?.linkedProxySessionId
    ? proxySessions.find((p) => p.id === previewChatSession.linkedProxySessionId)
    : null;

  return {
    previewSessionId,
    previewSummary,
    previewRequests,
    previewLoading,
    previewChatSession,
    previewLinkedProxy,
    loadPreview,
    clearPreview,
    handleSelect,
  };
}

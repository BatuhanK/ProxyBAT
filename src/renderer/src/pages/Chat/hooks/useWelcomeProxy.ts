import { useState, useEffect } from "react";
import type { SessionSummary, HttpRequest, ProxySession } from "@shared/types";

/**
 * Fetches and caches the proxy session summary + last 10 requests
 * for the "welcome" (empty chat) screen.
 * Re-fetches whenever the linked proxy session ID changes.
 */
export function useWelcomeProxy(
  proxySessionId: string | null | undefined,
  proxySessions: ProxySession[],
) {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [requests, setRequests] = useState<HttpRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!proxySessionId) {
      setSummary(null);
      setRequests([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      (window.api as {
        session: { getSummary: (p: { sessionId: string }) => Promise<{ summary: SessionSummary | null }> };
      }).session.getSummary({ sessionId: proxySessionId }),
      (window.api as {
        request: { list: (p: { sessionId: string; limit: number }) => Promise<{ requests: HttpRequest[] }> };
      }).request.list({ sessionId: proxySessionId, limit: 10 }),
    ])
      .then(([summaryRes, requestsRes]) => {
        if (cancelled) return;
        setSummary(summaryRes.summary);
        setRequests(requestsRes.requests);
      })
      .catch(() => {
        if (cancelled) return;
        setSummary(null);
        setRequests([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [proxySessionId]);

  const linkedProxy = proxySessionId
    ? proxySessions.find((p) => p.id === proxySessionId) ?? null
    : null;

  return { linkedProxy, summary, requests, loading };
}

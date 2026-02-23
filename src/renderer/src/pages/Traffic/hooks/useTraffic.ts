import { useEffect, useCallback, useRef, useMemo, useState } from "react";
import { useSessionStore } from "@renderer/store/sessionStore";
import { useProxyStore } from "@renderer/store/proxyStore";
import {
  COLUMNS,
  DEFAULT_VISIBLE,
  DEFAULT_WIDTHS,
  type ColId,
} from "@renderer/components/RequestTable/RequestTable";
import { useResendStore } from "@renderer/store/resendStore";
import { useNavStore } from "@renderer/App";
import { useLocalStorage } from "@renderer/lib/useLocalStorage";
import { classifyResourceType } from "@shared/resourceType";
import type { HttpRequest } from "@shared/types";
import {
  METHODS,
  RESOURCE_FILTERS,
  STATUS_CATS,
  type ResourceFilterId,
} from "../constants";

const STATUS_CATEGORY_VALUES = new Set(STATUS_CATS);
const METHOD_VALUES = new Set(METHODS);

export function useTraffic() {
  const { activeSessionId } = useProxyStore();
  const {
    sessions,
    activeViewSessionId,
    requests,
    requestTotal,
    selectedRequestId,
    isLoadingRequests,
    pinnedSessionId,
    setPinnedSession,
    setActiveViewSession,
    fetchRequests,
    setSelectedRequest,
    clearSession,
    deleteFiltered,
  } = useSessionStore();

  const [search, setSearch] = useLocalStorage("traffic.search", "");
  const [method, setMethod] = useLocalStorage("traffic.method", "ALL");
  const [statusCat, setStatusCat] = useLocalStorage(
    "traffic.statusCat",
    "ALL",
  );
  const [resourceType, setResourceType] = useLocalStorage<ResourceFilterId>(
    "traffic.resourceType",
    "ALL",
  );

  const [visible, setVisible] = useLocalStorage(
    "traffic.columns.visible.v7",
    DEFAULT_VISIBLE,
  );
  const [widths, setWidths] = useLocalStorage(
    "traffic.columns.widths.v7",
    DEFAULT_WIDTHS,
  );

  const onToggleVisible = useCallback(
    (id: ColId) => {
      setVisible((v) => ({ ...v, [id]: !v[id] }));
    },
    [setVisible],
  );

  const onApplyDelta = useCallback(
    (id: ColId, delta: number) => {
      setWidths((prev) => {
        const col = COLUMNS.find((c) => c.id === id);
        const minWidth = col?.minWidth ?? 20;
        const current =
          prev[id] && prev[id] > 0
            ? prev[id]
            : DEFAULT_WIDTHS[id] ?? minWidth;
        return { ...prev, [id]: Math.max(minWidth, current + delta) };
      });
    },
    [setWidths],
  );

  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement>(null);

  const { addTab } = useResendStore();
  const { setPage } = useNavStore();

  const handleResend = useCallback(
    async (request: HttpRequest) => {
      let body: string | null = null;
      if (request.requestBodyKey) {
        try {
          const result = await window.api.request.getBody({
            key: request.requestBodyKey,
          });
          body = result.body;
        } catch {
          /* ignore */
        }
      }
      addTab(request, body);
      setPage("resend");
    },
    [addTab, setPage],
  );

  useEffect(() => {
    if (!deleteMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        deleteMenuRef.current &&
        !deleteMenuRef.current.contains(e.target as Node)
      ) {
        setDeleteMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [deleteMenuOpen]);

  useEffect(() => {
    if (pinnedSessionId) return;

    if (activeSessionId && activeViewSessionId !== activeSessionId) {
      setActiveViewSession(activeSessionId);
    } else if (!activeViewSessionId && sessions.length > 0) {
      setActiveViewSession(sessions[0].id);
    }
  }, [activeSessionId, sessions, pinnedSessionId]);

  const normalizedMethod = METHOD_VALUES.has(method as (typeof METHODS)[number])
    ? method
    : "ALL";
  const normalizedStatusCat = STATUS_CATEGORY_VALUES.has(
    statusCat as (typeof STATUS_CATS)[number],
  )
    ? statusCat
    : "ALL";

  useEffect(() => {
    if (activeViewSessionId) {
      fetchRequests({
        search: search || undefined,
        method: normalizedMethod !== "ALL" ? normalizedMethod : undefined,
        statusCategory:
          normalizedStatusCat !== "ALL"
            ? (normalizedStatusCat as "2xx" | "3xx" | "4xx" | "5xx")
            : undefined,
      });
    }
  }, [activeViewSessionId, search, normalizedMethod, normalizedStatusCat]);

  const filteredRequests = useMemo(
    () =>
      resourceType === "ALL"
        ? requests
        : requests.filter(
            (r) =>
              classifyResourceType(r.contentType, r.url) === resourceType,
          ),
    [requests, resourceType],
  );

  const selectedRequest = useMemo(
    () => filteredRequests.find((r) => r.id === selectedRequestId) ?? null,
    [filteredRequests, selectedRequestId],
  );

  const handleDeleteFiltered = useCallback(
    async (invert: boolean) => {
      if (!activeViewSessionId) return;
      setDeleteMenuOpen(false);
      await deleteFiltered({
        sessionId: activeViewSessionId,
        search: search || undefined,
        method: normalizedMethod !== "ALL" ? normalizedMethod : undefined,
        statusCategory: normalizedStatusCat !== "ALL" ? normalizedStatusCat : undefined,
        resourceType: resourceType !== "ALL" ? resourceType : undefined,
        invert,
      });
      await fetchRequests({
        search: search || undefined,
        method: normalizedMethod !== "ALL" ? normalizedMethod : undefined,
        statusCategory:
          normalizedStatusCat !== "ALL"
            ? (normalizedStatusCat as "2xx" | "3xx" | "4xx" | "5xx")
            : undefined,
      });
    },
    [
      activeViewSessionId,
      search,
      normalizedMethod,
      normalizedStatusCat,
      resourceType,
      deleteFiltered,
      fetchRequests,
    ],
  );

  const isPinned = pinnedSessionId === activeViewSessionId;
  const togglePin = useCallback(() => {
    if (isPinned) {
      setPinnedSession(null);
    } else if (activeViewSessionId) {
      setPinnedSession(activeViewSessionId);
    }
  }, [isPinned, activeViewSessionId, setPinnedSession]);

  const effectiveWidths = useMemo(() => {
    const next: Record<ColId, number> = {} as Record<ColId, number>;
    for (const col of COLUMNS) {
      const stored = widths[col.id];
      next[col.id] = stored && stored > 0 ? stored : DEFAULT_WIDTHS[col.id];
    }
    return next;
  }, [widths]);

  return {
    sessions,
    activeViewSessionId,
    requests,
    requestTotal,
    selectedRequestId,
    isLoadingRequests,
    pinnedSessionId,
    search,
    method: normalizedMethod,
    statusCat: normalizedStatusCat,
    resourceType,
    visible,
    widths: effectiveWidths,
    deleteMenuOpen,
    deleteMenuRef,
    filteredRequests,
    selectedRequest,
    isPinned,
    setSearch,
    setMethod,
    setStatusCat,
    setResourceType,
    setSelectedRequest,
    setDeleteMenuOpen,
    setActiveViewSession,
    fetchRequests,
    clearSession,
    handleResend,
    onToggleVisible,
    onApplyDelta,
    handleDeleteFiltered,
    togglePin,
    RESOURCE_FILTERS,
  };
}

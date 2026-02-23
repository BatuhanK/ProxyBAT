import { useRef, useEffect, useState } from "react";
import { X, Play, RefreshCw, AlertCircle, Settings } from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import { useSessionStore } from "@renderer/store/sessionStore";
import { useProxyStore } from "@renderer/store/proxyStore";
import { useNavStore } from "../App";

type Mode = "new" | "existing";

export function StartSessionModal() {
  const backdropRef = useRef<HTMLDivElement>(null);
  const { sessions, fetchSessions } = useSessionStore();
  const { closeStartModal, startProxy, errorMessage, clearError } = useProxyStore();
  const { setPage } = useNavStore();

  const [mode, setMode] = useState<Mode>("new");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [sessionName, setSessionName] = useState<string>("");

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-select first session if switching to existing mode and none selected
  useEffect(() => {
    if (mode === "existing" && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [mode, sessions, selectedSessionId]);

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeStartModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeStartModal]);

  // Clear error when modal is closed
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleStart = () => {
    if (mode === "existing" && selectedSessionId) {
      startProxy({ sessionId: selectedSessionId });
    } else {
      startProxy({
        sessionName: sessionName.trim() || undefined,
      });
    }
  };

  const handleGoToSettings = () => {
    closeStartModal();
    setPage('settings');
  };

  // Check if error is related to port conflict
  const isPortConflictError = errorMessage?.toLowerCase().includes('port') && 
                               errorMessage?.toLowerCase().includes('already in use');

  const sortedSessions = [...sessions].sort(
    (a, b) => b.startedAt - a.startedAt
  );

  const canStart =
    mode === "new" || (mode === "existing" && selectedSessionId);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) closeStartModal();
      }}
    >
      <div className="w-[420px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold">Start Proxy</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose how to start your capture session
            </p>
          </div>
          <button
            onClick={closeStartModal}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("new")}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-colors ${
                mode === "new"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <Play className="w-5 h-5" />
              <div className="text-center">
                <p className="text-xs font-medium">New Session</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Start fresh capture
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode("existing")}
              disabled={sessions.length === 0}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === "existing"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              <div className="text-center">
                <p className="text-xs font-medium">Continue Session</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Resume existing
                </p>
              </div>
            </button>
          </div>

          {/* New Session Input */}
          {mode === "new" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Session name (optional)
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder={`Session ${new Date().toLocaleString()}`}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                If left empty, a name will be generated automatically.
              </p>
            </div>
          )}

          {/* Existing Session Select */}
          {mode === "existing" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Select session
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Choose a session...</option>
                {sortedSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                    {session.status === "active" ? " (active)" : ""}
                    {" "}— {session.requestCount} requests
                  </option>
                ))}
              </select>
              {sortedSessions.length === 0 && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  No existing sessions found.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="px-5">
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-400">{errorMessage}</p>
                {isPortConflictError && (
                  <button
                    onClick={handleGoToSettings}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    Change port in Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end px-5 py-3 border-t border-border bg-muted/20 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={closeStartModal}
          >
            Cancel
          </Button>
          {errorMessage && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleStart}
            >
              Retry
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!canStart}
            onClick={handleStart}
          >
            Start Proxy
          </Button>
        </div>
      </div>
    </div>
  );
}

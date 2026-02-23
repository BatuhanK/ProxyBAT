import { useRef, useEffect } from "react";
import { useTerminalStore } from "@renderer/store/terminalStore";

interface TerminalTabProps {
  sessionId: string;
  isActive: boolean;
}

export function TerminalTab({ sessionId, isActive }: TerminalTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const store = useTerminalStore();
  const slot = store.sessions.get(sessionId);

  useEffect(() => {
    store.register(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const current = useTerminalStore.getState().sessions.get(sessionId);
    if (current?.initStarted) return;
    store.init(sessionId, containerRef.current);
  }, [isActive, sessionId]);

  useEffect(() => {
    if (!isActive) return;
    store.syncSize(sessionId);
    const raf = requestAnimationFrame(() => store.syncSize(sessionId));
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => store.syncSize(sessionId));
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [isActive, sessionId]);

  if (slot?.error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-xs text-red-400 text-center">{slot.error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      {!slot?.ready && (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          Starting terminal...
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          padding: '4px',
          visibility: slot?.ready ? 'visible' : 'hidden',
        }}
      />
    </div>
  );
}

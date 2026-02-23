import { useRef, useEffect, useState } from "react";
import { ArtifactsTab } from "./right-panel/ArtifactsTab";
import { TerminalTab } from "./right-panel/TerminalTab";
import { PanelHeader } from "./right-panel/PanelHeader";

interface RightPanelProps {
  sessionId: string | null;
  allSessionIds: string[];
  onClose: () => void;
}

export function RightPanel({ sessionId, allSessionIds, onClose }: RightPanelProps) {
  const [filesHeight, setFilesHeight] = useState(260);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = filesHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientY - dragStartY.current;
      const containerH = containerRef.current?.clientHeight ?? 600;
      const newH = Math.min(
        Math.max(dragStartHeight.current + delta, 80),
        containerH - 120,
      );
      setFilesHeight(newH);
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!sessionId) {
    return (
      <div className="flex flex-col h-full border-l border-border">
        <PanelHeader onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            Select a chat session to view its workspace files and terminal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full border-l border-border"
      ref={containerRef}
    >
      <PanelHeader onClose={onClose} />

      <div
        style={{ height: filesHeight, flexShrink: 0 }}
        className="overflow-hidden border-b border-border"
      >
        <ArtifactsTab sessionId={sessionId} />
      </div>

      <div
        onMouseDown={onDividerMouseDown}
        className="h-1.5 flex-shrink-0 bg-border/50 hover:bg-primary/40 cursor-row-resize transition-colors"
        title="Drag to resize"
      />

      <div className="flex-1 overflow-hidden min-h-0 relative">
        {allSessionIds.map((sid) => (
          <div
            key={sid}
            className="absolute inset-0"
            style={{ display: sid === sessionId ? undefined : 'none' }}
          >
            <TerminalTab sessionId={sid} isActive={sid === sessionId} />
          </div>
        ))}
      </div>
    </div>
  );
}

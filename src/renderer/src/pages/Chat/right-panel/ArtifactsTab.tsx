import { useCallback, useEffect, useState } from "react";
import { Button } from "@renderer/components/ui/button";
import { cn } from "@renderer/lib/utils";
import { FolderOpen, FileText, RefreshCw } from "lucide-react";
import { FileViewerModal } from "./FileViewerModal";

interface WorkspaceFile {
  path: string;
  size: number;
  modifiedAt: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

interface ArtifactsTabProps {
  sessionId: string;
}

export function ArtifactsTab({ sessionId }: ArtifactsTabProps) {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [modalFile, setModalFile] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<string>("");
  const [modalLoading, setModalLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await (window as any).api.agent.listWorkspaceFiles({
        sessionId,
      });
      const sorted = (result?.files ?? []).sort(
        (a: WorkspaceFile, b: WorkspaceFile) => a.path.localeCompare(b.path),
      );
      setFiles(sorted);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    (window as any).api.agent
      .getWorkspacePath({ sessionId })
      .then((r: { workspacePath: string | null }) => setWorkspacePath(r?.workspacePath ?? null))
      .catch(() => {});
  }, [sessionId]);

  const openFile = useCallback(
    async (filePath: string) => {
      setModalFile(filePath);
      setModalContent("");
      setModalLoading(true);
      try {
        const result = await (window as any).api.agent.readWorkspaceFile({
          sessionId,
          filePath,
        });
        setModalContent(result?.content ?? "");
      } catch {
        setModalContent("");
      } finally {
        setModalLoading(false);
      }
    },
    [sessionId],
  );

  const openFolder = useCallback(async () => {
    try {
      const result = await (window as any).api.agent.getWorkspacePath({
        sessionId,
      });
      if (result?.workspacePath) {
        (window as any).api.shell.openPath(result.workspacePath).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) loadFiles();
  }, [sessionId, loadFiles]);

  useEffect(() => {
    const unsub = (window as any).api.on.workspaceFilesChanged((data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        loadFiles();
      }
    });
    return unsub;
  }, [sessionId, loadFiles]);

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border flex-shrink-0">
          <span className="text-xs text-muted-foreground">Workspace files</span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground"
              onClick={openFolder}
              title="Open folder in editor"
            >
              <FolderOpen className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground"
              onClick={loadFiles}
              title="Refresh"
            >
              <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-8 px-4 text-center">
              <FolderOpen className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                {loading
                  ? "Loading..."
                  : "No files yet. The agent will create files here as it works."}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => openFile(file.path)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-muted/30 transition-colors text-left group"
                >
                  <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-mono truncate flex-1 min-w-0 text-foreground/80 group-hover:text-foreground">
                    {file.path}
                  </span>
                  <span className="text-xs text-muted-foreground/60 flex-shrink-0 tabular-nums">
                    {formatBytes(file.size)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalFile !== null && (
        <FileViewerModal
          filePath={modalFile}
          absolutePath={workspacePath ? `${workspacePath}/${modalFile}` : modalFile}
          content={modalContent}
          loading={modalLoading}
          onClose={() => setModalFile(null)}
        />
      )}
    </>
  );
}

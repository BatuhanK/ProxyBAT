import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@renderer/components/ui/button";
import { ExternalLink, FileText, X } from "lucide-react";

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    py: "python",
    js: "javascript",
    ts: "typescript",
    tsx: "tsx",
    jsx: "jsx",
    json: "json",
    md: "markdown",
    sh: "bash",
    html: "html",
    css: "css",
    yml: "yaml",
    yaml: "yaml",
    txt: "text",
    rs: "rust",
    go: "go",
    rb: "ruby",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
  };
  return map[ext] ?? "text";
}

interface FileViewerModalProps {
  filePath: string;
  absolutePath: string;
  content: string;
  loading: boolean;
  onClose: () => void;
}

export function FileViewerModal({
  filePath,
  absolutePath,
  content,
  loading,
  onClose,
}: FileViewerModalProps) {
  const lang = getLanguageFromPath(filePath);
  const isMarkdown = lang === "markdown";

  const openInEditor = () => {
    (window as any).api.shell.openPath(absolutePath).catch(() => {});
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col bg-background border border-border rounded-lg shadow-2xl"
        style={{ width: "80vw", height: "80vh", maxWidth: 1200 }}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
          <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-mono truncate flex-1 min-w-0 text-foreground/80">
            {filePath}
          </span>
          <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
            {lang}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={openInEditor}
            title="Open in system editor"
          >
            <ExternalLink className="w-3 h-3" />
            Open in Editor
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground flex-shrink-0"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Loading...
            </div>
          ) : isMarkdown ? (
            <div className="prose prose-sm prose-invert max-w-none p-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <pre className="text-xs font-mono p-4 whitespace-pre-wrap break-all leading-relaxed text-foreground/80">
              {content || (
                <span className="text-muted-foreground italic">(empty file)</span>
              )}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

import { useResendRequest } from "../hooks/useResendRequest";
import type { ResendTab } from "@renderer/store/resendStore";
import { cn } from "@renderer/lib/utils";
import { MethodSelect } from "./MethodSelect";
import { Input } from "@renderer/components/ui/input";
import { Button } from "@renderer/components/ui/button";
import { HeadersEditor } from "./HeadersEditor";
import { ResponsePanel } from "./ResponsePanel";
import { Loader2, Send } from "lucide-react";

interface TabEditorProps {
  tab: ResendTab;
}

type RequestTab = "headers" | "body";

export function TabEditor({ tab }: TabEditorProps) {
  const {
    activeSection,
    setActiveSection,
    isSendDisabled,
    handleSend,
    onMethodChange,
    onUrlChange,
    onHeadersChange,
    onBodyChange,
  } = useResendRequest(tab);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-0 px-3 py-2 border-b border-border flex-shrink-0">
        <MethodSelect value={tab.method} onChange={onMethodChange} />
        <Input
          value={tab.url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://example.com/api/endpoint"
          className="h-8 text-xs font-mono rounded-none border-border flex-1 min-w-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !tab.sending) handleSend();
          }}
        />
        <Button
          onClick={handleSend}
          disabled={isSendDisabled}
          className="h-8 rounded-l-none rounded-r text-xs px-3 gap-1"
        >
          {tab.sending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
          Send
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 flex flex-col overflow-hidden border-r border-border">
          <div className="flex items-center gap-1 px-3 py-1 border-b border-border/50 flex-shrink-0">
            {(["headers", "body"] as RequestTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveSection(t)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded transition-colors capitalize",
                  activeSection === t
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-3">
            {activeSection === "headers" ? (
              <HeadersEditor headers={tab.headers} onChange={onHeadersChange} />
            ) : (
              <textarea
                value={tab.body}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder="Request body..."
                className="w-full h-full resize-none bg-transparent text-xs font-mono text-foreground/90 outline-none placeholder:text-muted-foreground"
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ResponsePanel tab={tab} />
        </div>
      </div>
    </div>
  );
}

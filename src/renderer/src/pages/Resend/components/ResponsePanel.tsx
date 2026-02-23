import { Loader2 } from "lucide-react";
import { cn, getStatusColor } from "@renderer/lib/utils";
import type { ResendTab } from "@renderer/store/resendStore";
import { ResponseTabs } from "./ResponseTabs";

interface ResponsePanelProps {
  tab: ResendTab;
}

export function ResponsePanel({ tab }: ResponsePanelProps) {
  if (tab.sending) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Sending...</span>
      </div>
    );
  }

  if (tab.error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-400 font-mono">{tab.error}</p>
      </div>
    );
  }

  if (!tab.response) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <span className="text-sm">Send a request to see the response</span>
      </div>
    );
  }

  const { statusCode, statusText, headers, body, durationMs } = tab.response;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border flex-shrink-0 text-xs font-mono">
        <span className={cn("font-semibold", getStatusColor(statusCode))}>
          {statusCode} {statusText}
        </span>
        <span className="text-muted-foreground">{durationMs}ms</span>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <ResponseTabs headers={headers} body={body} />
      </div>
    </div>
  );
}

import { useState } from "react";
import { Badge } from "@renderer/components/ui/badge";
import { Wrench, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { AgentToolCall } from "@renderer/store/agentStore";

interface ToolCallCardProps {
  toolCall: AgentToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  let argsDisplay = toolCall.args;
  try {
    argsDisplay = JSON.stringify(JSON.parse(toolCall.args), null, 2);
  } catch {}

  let resultDisplay = toolCall.result ?? "";
  try {
    resultDisplay = JSON.stringify(JSON.parse(toolCall.result ?? ""), null, 2);
  } catch {}

  return (
    <div className="ml-9 rounded border border-border bg-muted/20 text-xs overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted/30 transition-colors text-left"
      >
        <Wrench className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <span className="font-mono text-primary/80">{toolCall.name}</span>
        {toolCall.isRunning ? (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />
        ) : (
          <Badge
            variant="outline"
            className="text-xs py-0 ml-auto text-green-500 border-green-500/30"
          >
            done
          </Badge>
        )}
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-2 space-y-1.5 border-t border-border">
          {argsDisplay && (
            <div>
              <span className="text-muted-foreground uppercase text-xs tracking-wider">
                args
              </span>
              <pre className="text-xs font-mono bg-background rounded p-1.5 mt-0.5 whitespace-pre-wrap max-h-32 overflow-auto text-foreground/70">
                {argsDisplay}
              </pre>
            </div>
          )}
          {toolCall.result !== undefined && (
            <div>
              <span className="text-muted-foreground uppercase text-xs tracking-wider">
                result
              </span>
              <pre className="text-xs font-mono bg-background rounded p-1.5 mt-0.5 whitespace-pre-wrap max-h-48 overflow-auto text-foreground/70">
                {resultDisplay}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

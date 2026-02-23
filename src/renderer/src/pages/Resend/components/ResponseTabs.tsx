import { useState } from "react";
import { cn } from "@renderer/lib/utils";

type ResponseTab = "body" | "headers";

interface ResponseTabsProps {
  headers: Record<string, string>;
  body: string;
}

export function ResponseTabs({ headers, body }: ResponseTabsProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>("body");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-1 border-b border-border/50 flex-shrink-0">
        {(["body", "headers"] as ResponseTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "px-2 py-0.5 text-xs rounded transition-colors capitalize",
              activeTab === t
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {activeTab === "body" ? (
          <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap break-all">
            {body || (
              <span className="text-muted-foreground">(empty body)</span>
            )}
          </pre>
        ) : (
          <div className="flex flex-col gap-1">
            {Object.entries(headers).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs font-mono">
                <span className="text-blue-400/80 flex-shrink-0">{k}:</span>
                <span className="text-foreground/80 break-all">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useRef } from "react";
import { useResendTabs } from "./hooks/useResendTabs";
import { TabEditor } from "./components";
import { cn, getMethodColor } from "@renderer/lib/utils";
import { X, Send } from "lucide-react";

export function ResendPage() {
  const { tabs, activeTabId, activeTab, closeTab, setActiveTab } =
    useResendTabs();
  const tabBarRef = useRef<HTMLDivElement>(null);

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <Send className="w-8 h-8 opacity-30" />
        <span className="text-sm">No requests yet</span>
        <span className="text-xs">Right-click a request in Traffic and choose &quot;Resend Request&quot;</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div
        ref={tabBarRef}
        className="flex items-center overflow-x-auto border-b border-border flex-shrink-0 bg-muted/20 scrollbar-none"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-mono whitespace-nowrap flex-shrink-0 border-r border-border/50 transition-colors group',
              tab.id === activeTabId
                ? 'bg-background text-foreground border-b-2 border-b-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <span className={cn('font-semibold text-[10px]', getMethodColor(tab.method))}>
              {tab.method}
            </span>
            <span className="max-w-[160px] truncate">{tab.title.replace(/^[A-Z]+ /, '')}</span>
            <span
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all rounded flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <TabEditor key={activeTab.id} tab={activeTab} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <span className="text-sm">Select a tab</span>
          </div>
        )}
      </div>
    </div>
  );
}

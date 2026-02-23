import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { cn } from "@renderer/lib/utils";
import { ChevronDown, Pin, PinOff, RefreshCw, Search, Trash2 } from "lucide-react";
import { METHODS, STATUS_CATS, type ResourceFilterId } from "../constants";

interface TrafficToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  method: string;
  onMethodChange: (value: string) => void;
  statusCat: string;
  onStatusCatChange: (value: string) => void;
  requestTotal: number;
  filteredCount: number;
  resourceType: ResourceFilterId;
  activeViewSessionId: string | null;
  isPinned: boolean;
  onTogglePin: () => void;
  onRefresh: () => void;
  deleteMenuOpen: boolean;
  setDeleteMenuOpen: (value: boolean | ((v: boolean) => boolean)) => void;
  deleteMenuRef: React.RefObject<HTMLDivElement | null>;
  onClearSession: (sessionId: string) => void;
  onDeleteFiltered: (invert: boolean) => void;
}

export function TrafficToolbar({
  search,
  onSearchChange,
  method,
  onMethodChange,
  statusCat,
  onStatusCatChange,
  requestTotal,
  filteredCount,
  resourceType,
  activeViewSessionId,
  isPinned,
  onTogglePin,
  onRefresh,
  deleteMenuOpen,
  setDeleteMenuOpen,
  deleteMenuRef,
  onClearSession,
  onDeleteFiltered,
}: TrafficToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
      <div className="relative flex-1 max-w-64">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter by URL, host..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-7 text-xs"
        />
      </div>

      <div className="flex gap-0.5">
        {METHODS.map((m) => (
          <button
            key={m}
            onClick={() => onMethodChange(m)}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              method === m
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex gap-0.5">
        {STATUS_CATS.map((s) => (
          <button
            key={s}
            onClick={() => onStatusCatChange(s)}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              statusCat === s
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <span className="text-xs text-muted-foreground">
        {resourceType !== "ALL" ? `${filteredCount}/` : ""}
        {requestTotal} req
      </span>

      {activeViewSessionId && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePin}
          className={cn(
            "h-7 w-7",
            isPinned
              ? "text-yellow-400 hover:text-yellow-300"
              : "text-muted-foreground hover:text-foreground",
          )}
          title={
            isPinned
              ? "Unpin session (auto-switch on proxy start)"
              : "Pin session (keep this view when proxy starts)"
          }
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        className="h-7 w-7"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </Button>

      {activeViewSessionId && (
        <div className="relative flex" ref={deleteMenuRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClearSession(activeViewSessionId)}
            className="h-7 w-7 rounded-r-none text-muted-foreground hover:text-red-400"
            title="Clear all requests in this session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteMenuOpen((o) => !o)}
            className="h-7 w-4 rounded-l-none border-l border-border/50 text-muted-foreground hover:text-red-400 px-0"
            title="Bulk delete options"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
          {deleteMenuOpen && (
            <div className="absolute right-0 top-8 z-30 w-48 rounded-md border border-border bg-popover shadow-md p-1">
              <button
                onClick={() => onDeleteFiltered(false)}
                className="flex w-full items-center px-3 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
              >
                Delete matching filter
              </button>
              <button
                onClick={() => onDeleteFiltered(true)}
                className="flex w-full items-center px-3 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
              >
                Delete non-matching filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

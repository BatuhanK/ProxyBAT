import { Button } from "@renderer/components/ui/button";
import { Switch } from "@renderer/components/ui/switch";
import type { InterceptScript } from "@shared/types";
import { Code2, Plus, Trash2 } from "lucide-react";
import { cn } from "@renderer/lib/utils";

interface ScriptListPaneProps {
  scripts: InterceptScript[];
  selectedId: string | null;
  onSelect: (script: InterceptScript) => void;
  onCreate: () => void;
  onToggle: (script: InterceptScript, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function ScriptListPane({
  scripts,
  selectedId,
  onSelect,
  onCreate,
  onToggle,
  onDelete,
}: ScriptListPaneProps) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-border flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Scripts
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreate}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {scripts.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center mt-4">
            <Code2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
            No scripts yet.<br />Click + to create one.
          </div>
        ) : (
          scripts.map((script) => (
            <div
              key={script.id}
              onClick={() => onSelect(script)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/40",
                selectedId === script.id && "bg-primary/10",
              )}
            >
              <Switch
                checked={script.enabled}
                onCheckedChange={() => {}}
                onClick={(e) => onToggle(script, e)}
                className="scale-75"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{script.name}</p>
                <p className="text-xs text-muted-foreground">{script.phase}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 flex-shrink-0"
                onClick={(e) => onDelete(script.id, e)}
                title="Delete script"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

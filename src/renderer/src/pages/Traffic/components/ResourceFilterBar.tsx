import { cn } from "@renderer/lib/utils";
import { RESOURCE_FILTERS, type ResourceFilterId } from "../constants";

interface ResourceFilterBarProps {
  resourceType: ResourceFilterId;
  onChange: (value: ResourceFilterId) => void;
}

export function ResourceFilterBar({
  resourceType,
  onChange,
}: ResourceFilterBarProps) {
  return (
    <div className="flex items-center gap-0.5 px-3 py-1 border-b border-border/50 flex-shrink-0 bg-muted/20">
      {RESOURCE_FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={cn(
            "px-2 py-0.5 text-xs rounded transition-colors",
            resourceType === f.id
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

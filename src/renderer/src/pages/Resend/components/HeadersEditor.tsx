import { Input } from "@renderer/components/ui/input";
import { X, Plus } from "lucide-react";

interface HeadersEditorProps {
  headers: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
  const entries = Object.entries(headers);

  const setEntry = (idx: number, key: string, value: string) => {
    const next = [...entries];
    next[idx] = [key, value];
    onChange(Object.fromEntries(next.filter(([k]) => k.trim() !== "")));
  };

  const removeEntry = (idx: number) => {
    const next = entries.filter((_, i) => i !== idx);
    onChange(Object.fromEntries(next));
  };

  const addEntry = () => {
    onChange({ ...headers, "": "" });
  };

  return (
    <div className="flex flex-col gap-1">
      {entries.map(([k, v], idx) => (
        <div key={`${k}-${idx}`} className="flex gap-1 items-center">
          <Input
            value={k}
            onChange={(e) => setEntry(idx, e.target.value, v)}
            placeholder="Header name"
            className="h-6 text-xs font-mono flex-1 min-w-0"
          />
          <Input
            value={v}
            onChange={(e) => setEntry(idx, k, e.target.value)}
            placeholder="Value"
            className="h-6 text-xs font-mono flex-[2] min-w-0"
          />
          <button
            onClick={() => removeEntry(idx)}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        onClick={addEntry}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 self-start"
      >
        <Plus className="w-3 h-3" />
        Add header
      </button>
    </div>
  );
}

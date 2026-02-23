import { useState } from "react";
import { cn, getMethodColor } from "@renderer/lib/utils";
import { METHODS } from "../constants";

interface MethodSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function MethodSelect({ value, onChange }: MethodSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-8 px-3 text-xs font-semibold rounded-l border border-r-0 border-border bg-muted/40 hover:bg-muted/60 transition-colors min-w-[72px] text-left",
          getMethodColor(value),
        )}
      >
        {value}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-9 z-30 w-28 rounded-md border border-border bg-popover shadow-lg py-1">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors font-semibold",
                  getMethodColor(m),
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

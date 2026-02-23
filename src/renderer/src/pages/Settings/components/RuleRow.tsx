import { cn } from "@renderer/lib/utils";

interface RuleRowProps {
  children: React.ReactNode;
  striped?: boolean;
}

export function RuleRow({ children, striped }: RuleRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm",
        striped && "bg-muted/20",
      )}
    >
      {children}
    </div>
  );
}

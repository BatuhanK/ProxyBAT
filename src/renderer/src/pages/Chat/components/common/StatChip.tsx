import { cn } from "@renderer/lib/utils";

interface StatChipProps {
  icon: React.ReactNode;
  label: string;
  className?: string;
}

export function StatChip({ icon, label, className }: StatChipProps) {
  return (
    <div className={cn("flex items-center gap-1 text-[10px] text-muted-foreground", className)}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

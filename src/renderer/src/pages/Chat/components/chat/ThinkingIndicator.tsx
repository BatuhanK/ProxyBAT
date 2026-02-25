import { BatIcon } from "@renderer/components/BatIcon";

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] animate-bat-pulse">
        <BatIcon className="w-6 h-6 text-primary animate-bat-flutter" />
      </div>
      <div className="flex flex-col gap-2 min-w-[140px]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary animate-pulse">
            Bat is thinking
          </span>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-shimmer w-[60%]"
              style={{ backgroundSize: "200% 100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import {
  Activity,
  Circle,
  Code2,
  LayoutList,
  MessageSquare,
  Send,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavStore } from "../App";
import iconSrc from "../assets/icon.png";
import { cn } from "../lib/utils";
import { useProxyStore } from "../store/proxyStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const navItems = [
  { id: "traffic" as const, label: "Traffic", icon: Activity },
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
];

const navItemsSecondary = [
  { id: "sessions" as const, label: "Sessions", icon: LayoutList },
  { id: "resend" as const, label: "Resend", icon: Send },
  { id: "scripts" as const, label: "Scripts", icon: Code2 },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { page, setPage } = useNavStore();
  const { status, port, openStartModal, stopProxy } = useProxyStore();

  const isRunning = status === "running";
  const isLoading = status === "starting";

  const [showText, setShowText] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setShowText((v) => !v), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-14 flex flex-col items-center py-3 border-r border-border bg-card gap-1 no-select">
      {/* Logo */}
      <div className="mb-3 w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center relative">
        <img
          src={iconSrc}
          alt="ProxyBat"
          className="w-8 h-8 object-cover absolute transition-opacity duration-500"
          style={{ opacity: showText ? 0 : 1 }}
        />
        <span
          className="absolute text-[11px] font-bold tracking-widest text-primary transition-opacity duration-500"
          style={{
            opacity: showText ? 1 : 0,
            textShadow: '0 0 6px hsl(142.1 76.2% 55%), 0 0 14px hsl(142.1 76.2% 45%)',
          }}
        >
          BAT
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setPage(id)}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                  page === id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}

        <div className="my-1 w-6 border-t border-border self-center" />

        {navItemsSecondary.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setPage(id)}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                  page === id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Proxy toggle at bottom */}
      <div className="flex flex-col items-center gap-1">
        {isRunning && port && (
          <span className="text-[10px] text-muted-foreground">{port}</span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={isRunning ? stopProxy : openStartModal}
              disabled={isLoading}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors border",
                isRunning
                  ? "border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                isLoading && "opacity-50 cursor-not-allowed",
              )}
            >
              <Circle
                className={cn("w-4 h-4", isRunning && "fill-green-400")}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isRunning
              ? `Proxy running on :${port} — Click to stop`
              : "Start proxy"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

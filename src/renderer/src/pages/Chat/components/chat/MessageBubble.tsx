import { cn } from "@renderer/lib/utils";
import { User } from "lucide-react";
import { BatIcon } from "@renderer/components/BatIcon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentMessage } from "@renderer/store/agentStore";

interface MessageBubbleProps {
  message: AgentMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          isUser ? "bg-muted" : "bg-primary/10",
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <BatIcon className="w-3.5 h-3.5 text-primary" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/40 text-foreground",
        )}
      >
        {isUser ? (
          <p className="leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-flex items-center gap-1 ml-1 align-middle">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20">
                  <BatIcon className="w-2.5 h-2.5 text-primary animate-bat-flutter" />
                </span>
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:100ms]" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:200ms]" />
                </span>
              </span>
            )}
          </div>
        )}
        <span className="text-xs opacity-40 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

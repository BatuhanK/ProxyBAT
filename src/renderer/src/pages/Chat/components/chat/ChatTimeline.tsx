import { useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { ToolCallCard } from "./ToolCallCard";
import { WelcomeMessage } from "./WelcomeMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";
import type { AgentMessage, AgentToolCall, AgentRole } from "@renderer/store/agentStore";
import type { SessionSummary, HttpRequest, ProxySession } from "@shared/types";

interface ChatTimelineProps {
  timeline: (AgentMessage | AgentToolCall)[];
  isThinking: boolean;
  currentRole: AgentRole;
  onSend: (message: string) => void;
  linkedProxy?: ProxySession | null;
  proxySummary?: SessionSummary | null;
  proxyRequests?: HttpRequest[];
  proxyLoading?: boolean;
}

export function ChatTimeline({
  timeline,
  isThinking,
  currentRole,
  onSend,
  linkedProxy,
  proxySummary,
  proxyRequests,
  proxyLoading,
}: ChatTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const lastTimelineLengthRef = useRef(timeline.length);

  // Check if user is near bottom (within 100px)
  const isNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Handle scroll events to track user position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      shouldScrollRef.current = isNearBottom();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isNearBottom]);

  // Auto-scroll logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !bottomRef.current) return;

    // Check if this is just a streaming update (same message count but content changed)
    const isStreamingUpdate = timeline.length === lastTimelineLengthRef.current && 
      timeline.length > 0 &&
      timeline[timeline.length - 1].kind === "message" &&
      (timeline[timeline.length - 1] as AgentMessage).isStreaming;

    // Update ref for next comparison
    lastTimelineLengthRef.current = timeline.length;

    // Only scroll if:
    // 1. User was near bottom before update, OR
    // 2. It's a new message (not streaming), OR
    // 3. User is sending a message (isThinking just became true)
    const shouldAutoScroll = shouldScrollRef.current || !isStreamingUpdate || isThinking;

    if (shouldAutoScroll) {
      // Use instant scroll for streaming to avoid jumps
      const behavior = isStreamingUpdate ? "instant" : "smooth";
      
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior, block: "end" });
      });
    }
  }, [timeline, isThinking]);

  const isEmpty = timeline.length === 0 && !isThinking;

  if (isEmpty) {
    return (
      <div ref={containerRef} className="flex-1 overflow-auto px-4 py-4">
        <WelcomeMessage
          role={currentRole}
          onSend={onSend}
          linkedProxy={linkedProxy}
          proxySummary={proxySummary}
          proxyRequests={proxyRequests}
          proxyLoading={proxyLoading}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-auto px-4 py-4 space-y-3">
      {timeline.map((item) =>
        item.kind === "message" ? (
          <MessageBubble key={item.id} message={item} />
        ) : (
          <ToolCallCard key={item.id} toolCall={item} />
        ),
      )}

      {isThinking &&
        (() => {
          const last = timeline[timeline.length - 1];
          const isStreamingNow =
            last?.kind === "message" &&
            last.role === "assistant" &&
            last.isStreaming;
          return !isStreamingNow && <ThinkingIndicator />;
        })()}
      <div ref={bottomRef} />
    </div>
  );
}

import { Input } from "@renderer/components/ui/input";
import { Button } from "@renderer/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  isThinking: boolean;
  placeholder: string;
  description: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function ChatInput({
  input,
  isThinking,
  placeholder,
  description,
  onChange,
  onSend,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex-shrink-0 px-4 py-3 border-t border-border">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-9 text-sm"
            disabled={isThinking}
          />
        </div>
        <Button
          onClick={onSend}
          disabled={!input.trim() || isThinking}
          size="icon"
          className="h-9 w-9 flex-shrink-0"
        >
          {isThinking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
    </div>
  );
}

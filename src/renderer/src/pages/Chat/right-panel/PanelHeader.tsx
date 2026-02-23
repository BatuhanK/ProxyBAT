import { Button } from "@renderer/components/ui/button";
import { FolderOpen, X } from "lucide-react";

interface PanelHeaderProps {
  onClose: () => void;
}

export function PanelHeader({ onClose }: PanelHeaderProps) {
  return (
    <div className="flex items-center border-b border-border flex-shrink-0 px-2 h-9 gap-1">
      <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground flex-1">Workspace</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground flex-shrink-0"
        onClick={onClose}
        title="Close panel"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

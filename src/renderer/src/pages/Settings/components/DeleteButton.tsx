import { Button } from "@renderer/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onClick: () => void;
}

export function DeleteButton({ onClick }: DeleteButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-red-400"
      onClick={onClick}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  );
}

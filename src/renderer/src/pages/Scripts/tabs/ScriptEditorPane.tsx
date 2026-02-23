import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import type { InterceptScript } from "@shared/types";
import { Code2, Save } from "lucide-react";
import { cn } from "@renderer/lib/utils";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { PHASE_OPTIONS } from "../constants";

interface ScriptEditorPaneProps {
  selectedScript: InterceptScript | null;
  editName: string;
  editCode: string;
  editPhase: InterceptScript["phase"];
  isDirty: boolean;
  saving: boolean;
  onNameChange: (value: string) => void;
  onPhaseChange: (value: InterceptScript["phase"]) => void;
  onCodeChange: (value: string) => void;
  onSave: () => void;
}

export function ScriptEditorPane({
  selectedScript,
  editName,
  editCode,
  editPhase,
  isDirty,
  saving,
  onNameChange,
  onPhaseChange,
  onCodeChange,
  onSave,
}: ScriptEditorPaneProps) {
  if (!selectedScript) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
          <Code2 className="w-8 h-8 opacity-30" />
          <span className="text-sm">Select a script to edit</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
        <Input
          value={editName}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-7 text-sm flex-1 max-w-48"
        />

        <div className="flex gap-0.5">
          {PHASE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPhaseChange(opt.value)}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                editPhase === opt.value
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {isDirty && (
          <span className="text-xs text-yellow-500">Unsaved changes</span>
        )}

        <Button size="sm" className="h-7" onClick={onSave} disabled={saving || !isDirty}>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <CodeMirror
          value={editCode}
          onChange={onCodeChange}
          extensions={[python()]}
          theme={oneDark}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            indentOnInput: true,
            tabSize: 2,
          }}
          style={{ height: "100%", fontSize: "12px" }}
          className="h-full"
        />
      </div>

      <div className="flex items-center gap-3 px-3 py-1 border-t border-border text-xs text-muted-foreground flex-shrink-0">
        <Badge
          variant={selectedScript.enabled ? "default" : "secondary"}
          className="text-xs py-0"
        >
          {selectedScript.enabled ? "enabled" : "disabled"}
        </Badge>
        <span>Phase: {editPhase}</span>
        <span className="flex-1" />
        <span>Python · Cmd+S to save</span>
      </div>
    </div>
  );
}

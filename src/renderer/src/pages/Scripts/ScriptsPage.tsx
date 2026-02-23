import { ScriptEditorPane, ScriptListPane } from "./tabs";
import { useScripts } from "./hooks/useScripts";

export function ScriptsPage() {
  const scriptsState = useScripts();

  return (
    <div className="flex h-full overflow-hidden">
      <ScriptListPane
        scripts={scriptsState.scripts}
        selectedId={scriptsState.selectedId}
        onSelect={scriptsState.selectScript}
        onCreate={scriptsState.createScript}
        onToggle={scriptsState.toggleScript}
        onDelete={scriptsState.deleteScript}
      />
      <ScriptEditorPane
        selectedScript={scriptsState.selectedScript}
        editName={scriptsState.editName}
        editCode={scriptsState.editCode}
        editPhase={scriptsState.editPhase}
        isDirty={scriptsState.isDirty}
        saving={scriptsState.saving}
        onNameChange={scriptsState.handleNameChange}
        onPhaseChange={scriptsState.handlePhaseChange}
        onCodeChange={scriptsState.handleEditorChange}
        onSave={scriptsState.saveScript}
      />
    </div>
  );
}

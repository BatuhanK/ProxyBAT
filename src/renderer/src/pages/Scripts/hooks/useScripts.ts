import type { InterceptScript } from "@shared/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_CODE } from "../constants";

export function useScripts() {
  const [scripts, setScripts] = useState<InterceptScript[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editPhase, setEditPhase] = useState<InterceptScript["phase"]>("both");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    const result = await window.api.script.list();
    setScripts(result.scripts);
  };

  const selectScript = (script: InterceptScript) => {
    setSelectedId(script.id);
    setEditName(script.name);
    setEditCode(script.code);
    setEditPhase(script.phase);
    setIsDirty(false);
  };

  const createScript = async () => {
    const result = await window.api.script.create({
      name: "New Script",
      code: DEFAULT_CODE,
      phase: "both",
      enabled: false,
    });
    setScripts((s) => [...s, result.script]);
    selectScript(result.script);
  };

  const saveScript = useCallback(async () => {
    if (!selectedId) return;
    setSaving(true);
    await window.api.script.update({
      id: selectedId,
      name: editName,
      code: editCode,
      phase: editPhase,
    });
    setScripts((s) =>
      s.map((x) =>
        x.id === selectedId
          ? {
              ...x,
              name: editName,
              code: editCode,
              phase: editPhase,
              updatedAt: Date.now(),
            }
          : x,
      ),
    );
    setIsDirty(false);
    setSaving(false);
  }, [selectedId, editName, editCode, editPhase]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveScript();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveScript]);

  const toggleScript = async (script: InterceptScript, e: React.MouseEvent) => {
    e.stopPropagation();
    await window.api.script.update({ id: script.id, enabled: !script.enabled });
    setScripts((s) =>
      s.map((x) =>
        x.id === script.id ? { ...x, enabled: !x.enabled } : x,
      ),
    );
  };

  const deleteScript = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await window.api.script.delete({ id });
    if (result.success) {
      setScripts((s) => s.filter((x) => x.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setEditName("");
        setEditCode("");
      }
    } else {
      loadScripts();
    }
  };

  const handleEditorChange = useCallback((value: string) => {
    setEditCode(value);
    setIsDirty(true);
  }, []);

  const handleNameChange = (value: string) => {
    setEditName(value);
    setIsDirty(true);
  };

  const handlePhaseChange = (value: InterceptScript["phase"]) => {
    setEditPhase(value);
    setIsDirty(true);
  };

  const selectedScript = useMemo(
    () => scripts.find((s) => s.id === selectedId) ?? null,
    [scripts, selectedId],
  );

  return {
    scripts,
    selectedId,
    editName,
    editCode,
    editPhase,
    isDirty,
    saving,
    selectedScript,
    setSelectedId,
    loadScripts,
    selectScript,
    createScript,
    saveScript,
    toggleScript,
    deleteScript,
    handleEditorChange,
    handleNameChange,
    handlePhaseChange,
  };
}

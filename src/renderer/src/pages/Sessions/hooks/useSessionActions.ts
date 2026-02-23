import { useState } from 'react'
import { useSessionStore } from '@renderer/store/sessionStore'

export function useSessionActions() {
  const { fetchSessions, mergeSessions } = useSessionStore()
  const [mergeMode, setMergeMode] = useState<{ sourceId: string } | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  async function handleRename(id: string) {
    if (!renameValue.trim()) return
    await window.api.session.update({ sessionId: id, name: renameValue.trim() })
    setRenamingId(null)
    fetchSessions()
  }

  async function handleMerge(targetId: string) {
    if (!mergeMode) return
    await mergeSessions(mergeMode.sourceId, targetId)
    setMergeMode(null)
  }

  function startRename(session: { id: string; name: string }) {
    setRenamingId(session.id)
    setRenameValue(session.name)
  }

  function cancelRename() {
    setRenamingId(null)
    setRenameValue('')
  }

  function confirmRename() {
    if (renamingId) {
      handleRename(renamingId)
    }
  }

  function startMerge(sourceId: string) {
    setMergeMode({ sourceId })
  }

  function cancelMerge() {
    setMergeMode(null)
  }

  return {
    // State
    mergeMode,
    renamingId,
    renameValue,
    
    // Setters
    setRenameValue,
    
    // Actions
    startRename,
    cancelRename,
    confirmRename,
    startMerge,
    cancelMerge,
    handleMerge,
  }
}

import { useEffect } from 'react'
import { useSessionStore } from '@renderer/store/sessionStore'
import { useProxyStore } from '@renderer/store/proxyStore'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { useSessionActions } from './hooks/useSessionActions'
import { SessionCard, SessionHeader } from './components'

export function SessionsPage() {
  const { sessions, activeViewSessionId, fetchSessions, setActiveViewSession, setPinnedSession, deleteSession } =
    useSessionStore()
  const { activeSessionId, status, openStartModal, stopProxy } = useProxyStore()

  const handleView = (id: string) => {
    setActiveViewSession(id)
    if (id !== activeSessionId) {
      setPinnedSession(id)
    } else {
      setPinnedSession(null)
    }
  }
  
  const {
    mergeMode,
    renamingId,
    renameValue,
    setRenameValue,
    startRename,
    cancelRename,
    confirmRename,
    startMerge,
    cancelMerge,
    handleMerge,
  } = useSessionActions()

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex flex-col gap-3">
        <SessionHeader
          proxyStatus={status}
          mergeMode={mergeMode}
          sessions={sessions}
          onStartProxy={openStartModal}
          onStopProxy={stopProxy}
          onCancelMerge={cancelMerge}
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              isViewing={session.id === activeViewSessionId}
              isMergeTarget={mergeMode !== null && mergeMode.sourceId !== session.id}
              isMergeSource={mergeMode?.sourceId === session.id}
              isRenaming={renamingId === session.id}
              renameValue={renameValue}
              onView={() => handleView(session.id)}
              onDelete={() => deleteSession(session.id)}
              onMergeStart={() => startMerge(session.id)}
              onMergeTarget={() => handleMerge(session.id)}
              onRenameStart={() => startRename(session)}
              onRenameChange={setRenameValue}
              onRenameConfirm={confirmRename}
              onRenameCancel={cancelRename}
            />
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No sessions yet. Start the proxy to begin capturing traffic.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

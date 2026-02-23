import { formatDuration } from '../utils/formatDuration'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Check, Edit2, Merge, Trash2, X } from 'lucide-react'
import type { ProxySession } from '@shared/types'
import { cn } from '@renderer/lib/utils'

interface SessionCardProps {
  session: ProxySession
  isActive: boolean
  isViewing: boolean
  isMergeTarget: boolean
  isMergeSource: boolean
  isRenaming: boolean
  renameValue: string
  onView: () => void
  onDelete: () => void
  onMergeStart: () => void
  onMergeTarget: () => void
  onRenameStart: () => void
  onRenameChange: (v: string) => void
  onRenameConfirm: () => void
  onRenameCancel: () => void
}

export function SessionCard({
  session,
  isActive,
  isViewing,
  isMergeTarget,
  isMergeSource,
  isRenaming,
  renameValue,
  onView,
  onDelete,
  onMergeStart,
  onMergeTarget,
  onRenameStart,
  onRenameChange,
  onRenameConfirm,
  onRenameCancel
}: SessionCardProps) {
  const duration = session.endedAt
    ? Math.round((session.endedAt - session.startedAt) / 1000)
    : Math.round((Date.now() - session.startedAt) / 1000)

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors',
        // Base card style — clickable unless merge-target or merge-source
        !isMergeTarget && !isMergeSource && 'cursor-pointer',
        // Viewing state: blue left border + subtle tint
        isViewing && !isActive && 'border-l-2 border-l-primary border-border bg-primary/5',
        // Recording state: green left border + subtle tint
        isActive && 'border-l-2 border-l-green-500 border-border bg-green-500/5',
        // Default
        !isViewing && !isActive && 'border-border bg-card',
        // Merge states
        isMergeTarget && 'border-yellow-500/40 bg-yellow-500/5 cursor-pointer hover:bg-yellow-500/10',
        isMergeSource && 'opacity-50'
      )}
      onClick={isMergeTarget ? onMergeTarget : (!isMergeSource ? onView : undefined)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => onRenameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRenameConfirm()
                  if (e.key === 'Escape') onRenameCancel()
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-input border border-border rounded px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <button onClick={(e) => { e.stopPropagation(); onRenameConfirm() }} className="text-primary hover:text-primary/80">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onRenameCancel() }} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">{session.name}</span>
              {isActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/30 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Recording
                </span>
              )}
              {isViewing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Viewing
                </span>
              )}
              {session.status === 'stopped' && !isActive && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Stopped</Badge>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              {session.requestCount.toLocaleString()} requests
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDuration(duration)}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(session.startedAt).toLocaleString()}
            </span>
          </div>
        </div>

        {!isMergeTarget && !isRenaming && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={onRenameStart} className="h-7 w-7">
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onMergeStart} className="h-7 w-7 text-muted-foreground">
              <Merge className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-muted-foreground hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

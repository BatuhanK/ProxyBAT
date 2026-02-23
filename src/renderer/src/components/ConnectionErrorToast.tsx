import { useConnectionErrorStore } from '../store/connectionErrorStore'
import type { ConnectionErrorEntry, ConnectionErrorType } from '../store/connectionErrorStore'
import { Button } from './ui/button'
import { X, AlertTriangle, ShieldOff, Clock } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

// Max number of toasts to show at once
const MAX_VISIBLE = 5

function errorIcon(type: ConnectionErrorType) {
  switch (type) {
    case 'ssl_error':
      return <ShieldOff className="w-3.5 h-3.5 flex-shrink-0 text-yellow-400" />
    case 'timeout':
      return <Clock className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
    default:
      return <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
  }
}

function errorLabel(type: ConnectionErrorType) {
  switch (type) {
    case 'ssl_error':
      return 'SSL error'
    case 'timeout':
      return 'Timeout'
    case 'connection_refused':
      return 'Connection refused'
    default:
      return 'Connection error'
  }
}

interface ToastItemProps {
  entry: ConnectionErrorEntry
  onDismiss: () => void
  onAddIgnore: () => void
  onAddSslRule: () => void
}

function ToastItem({ entry, onDismiss, onAddIgnore, onAddSslRule }: ToastItemProps) {
  const showSslAction = entry.errorType === 'ssl_error'

  return (
    <div className={cn(
      'flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg',
      'w-[360px] text-xs animate-in slide-in-from-bottom-2 fade-in-0 duration-200'
    )}>
      {/* Header row */}
      <div className="flex items-start gap-2">
        {errorIcon(entry.errorType)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground truncate">{entry.host}</span>
            <span className="text-muted-foreground shrink-0">&mdash;</span>
            <span className="text-muted-foreground shrink-0">{errorLabel(entry.errorType)}</span>
          </div>
          {entry.reason && (
            <p className="text-muted-foreground mt-0.5 truncate" title={entry.reason}>
              {entry.reason}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 -mt-0.5"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-xs px-2 py-0 flex-1"
          onClick={onAddIgnore}
        >
          Ignore {entry.host}
        </Button>
        {showSslAction && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2 py-0 flex-1 border-yellow-400/30 text-yellow-400 hover:text-yellow-300"
            onClick={onAddSslRule}
          >
            Add SSL rule
          </Button>
        )}
      </div>
    </div>
  )
}

export function ConnectionErrorToast() {
  const { errors, dismiss, dismissAll } = useConnectionErrorStore()

  const visible = errors
    .filter((e) => !e.dismissed)
    .slice(-MAX_VISIBLE) // show most recent N

  if (visible.length === 0) return null

  const handleAddIgnore = async (entry: ConnectionErrorEntry) => {
    // Create an ignore rule for the host — matches all URLs on this host
    const pattern = `*://${entry.host}/*`
    try {
      await (window.api as {
        ignoreRule: { create: (p: { pattern: string; enabled?: boolean }) => Promise<unknown> }
      }).ignoreRule.create({ pattern, enabled: true })
    } catch {
      // best-effort — silently fail
    }
    dismiss(entry.id)
  }

  const handleAddSslRule = async (entry: ConnectionErrorEntry) => {
    // Create an SSL intercept rule for the exact host
    try {
      await window.api.sslRule.create({ pattern: entry.host, enabled: true })
    } catch {
      // best-effort
    }
    dismiss(entry.id)
  }

  return (
    <div
      className="fixed bottom-4 right-4 flex flex-col gap-2 z-50"
      style={{ pointerEvents: 'none' }}
    >
      {/* Dismiss all — only show when >1 toast */}
      {visible.length > 1 && (
        <div className="flex justify-end" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={dismissAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Dismiss all ({visible.length})
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2" style={{ pointerEvents: 'auto' }}>
        {visible.map((entry) => (
          <ToastItem
            key={entry.id}
            entry={entry}
            onDismiss={() => dismiss(entry.id)}
            onAddIgnore={() => handleAddIgnore(entry)}
            onAddSslRule={() => handleAddSslRule(entry)}
          />
        ))}
      </div>
    </div>
  )
}

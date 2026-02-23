import { Button } from '@renderer/components/ui/button'
import { Play, Square, X } from 'lucide-react'
import type { ProxySession, ProxyStatus } from '@shared/types'

interface SessionHeaderProps {
  proxyStatus: ProxyStatus
  mergeMode: { sourceId: string } | null
  sessions: ProxySession[]
  onStartProxy: () => void
  onStopProxy: () => void
  onCancelMerge: () => void
}

export function SessionHeader({
  proxyStatus,
  mergeMode,
  sessions,
  onStartProxy,
  onStopProxy,
  onCancelMerge
}: SessionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium">Sessions</h2>
      <div className="flex gap-2">
        {mergeMode && (
          <Button variant="outline" size="sm" onClick={onCancelMerge}>
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel Merge
          </Button>
        )}
        {proxyStatus === 'stopped' ? (
          <Button size="sm" onClick={onStartProxy}>
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Start Proxy
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onStopProxy}>
            <Square className="w-3.5 h-3.5 mr-1.5" />
            Stop Proxy
          </Button>
        )}
      </div>
      
      {mergeMode && (
        <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400">
          Select a target session to merge "{sessions.find(s => s.id === mergeMode.sourceId)?.name}" into...
        </div>
      )}
    </div>
  )
}

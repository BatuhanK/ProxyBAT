import { useRef, useEffect } from 'react'
import { useScriptLogStore } from '@renderer/store/scriptLogStore'
import type { ScriptLogEntry, ScriptLogLevel } from '@renderer/store/scriptLogStore'
import { Button } from '@renderer/components/ui/button'
import { ChevronDown, ChevronUp, Trash2, Terminal } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

const LEVEL_STYLES: Record<ScriptLogLevel, string> = {
  debug:  'text-zinc-500',
  info:   'text-zinc-300',
  warn:   'text-yellow-400',
  error:  'text-red-400',
  alert:  'text-orange-400',
}

const LEVEL_BADGE: Record<ScriptLogLevel, string> = {
  debug:  'bg-zinc-800 text-zinc-400',
  info:   'bg-zinc-700 text-zinc-200',
  warn:   'bg-yellow-900/60 text-yellow-400',
  error:  'bg-red-900/60 text-red-400',
  alert:  'bg-orange-900/60 text-orange-400',
}

function LogRow({ entry }: { entry: ScriptLogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour12: false })
  const isError = entry.level === 'error'

  return (
    <div className={cn(
      'flex gap-2 px-3 py-0.5 font-mono text-xs border-b border-border/30 hover:bg-white/5 transition-colors',
      isError && 'bg-red-950/20',
    )}>
      <span className="text-zinc-600 shrink-0 select-none w-16">{time}</span>
      <span className={cn(
        'shrink-0 px-1 rounded text-[10px] font-semibold uppercase leading-4 my-auto',
        LEVEL_BADGE[entry.level] ?? LEVEL_BADGE.info
      )}>
        {entry.level}
      </span>
      <span className="shrink-0 text-blue-400/80 max-w-[140px] truncate" title={entry.script}>
        {entry.script}
      </span>
      <span className={cn('flex-1 whitespace-pre-wrap break-all', LEVEL_STYLES[entry.level] ?? LEVEL_STYLES.info)}>
        {entry.message}
      </span>
    </div>
  )
}

// Unique script names from logs
function useScriptNames(logs: ScriptLogEntry[]): string[] {
  const seen = new Set<string>()
  for (const l of logs) seen.add(l.script)
  return Array.from(seen)
}

export function ScriptConsole() {
  const { logs, filterScript, open, clearLogs, setFilterScript, toggleOpen } = useScriptLogStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const scriptNames = useScriptNames(logs)

  const errorCount = logs.filter((l) => l.level === 'error').length
  const warnCount  = logs.filter((l) => l.level === 'warn').length

  const visible = filterScript
    ? logs.filter((l) => l.script === filterScript)
    : logs

  // Auto-scroll to bottom when new log arrives and panel is open
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs.length, open])

  return (
    <div className={cn(
      'flex flex-col border-t border-border bg-zinc-950 transition-all duration-200 flex-shrink-0',
      open ? 'h-52' : 'h-8'
    )}>
      {/* Header bar — always visible */}
      <div
        className="flex items-center gap-2 px-3 h-8 flex-shrink-0 cursor-pointer select-none hover:bg-white/5"
        onClick={toggleOpen}
      >
        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Script Console</span>

        {logs.length > 0 && (
          <span className="text-xs text-zinc-500 ml-1">{logs.length}</span>
        )}

        {errorCount > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0 rounded bg-red-900/60 text-red-400">
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </span>
        )}
        {warnCount > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0 rounded bg-yellow-900/60 text-yellow-400">
            {warnCount} warn{warnCount !== 1 ? 's' : ''}
          </span>
        )}

        <div className="flex-1" />

        {/* Script filter pills — only shown when open */}
        {open && scriptNames.length > 1 && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setFilterScript(null)}
              className={cn(
                'text-[10px] px-1.5 py-0 rounded transition-colors',
                filterScript === null
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All
            </button>
            {scriptNames.map((name) => (
              <button
                key={name}
                onClick={() => setFilterScript(filterScript === name ? null : name)}
                className={cn(
                  'text-[10px] px-1.5 py-0 rounded transition-colors max-w-[120px] truncate',
                  filterScript === name
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={name}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {open && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); clearLogs() }}
            title="Clear logs"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}

        <div className="text-muted-foreground" onClick={(e) => { e.stopPropagation(); toggleOpen() }}>
          {open
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronUp className="w-3.5 h-3.5" />
          }
        </div>
      </div>

      {/* Log body — only when open */}
      {open && (
        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-zinc-600 italic">
              No logs yet. Script ctx.log.info() calls will appear here.
            </div>
          ) : (
            <>
              {visible.map((entry) => (
                <LogRow key={entry.id} entry={entry} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

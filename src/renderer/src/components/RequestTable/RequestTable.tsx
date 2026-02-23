import { useState, useCallback, memo, useEffect } from 'react'
import type { HttpRequest } from '@shared/types'
import { cn, getStatusColor, formatDuration } from '@renderer/lib/utils'
import { classifyResourceType, type ResourceType } from '@shared/resourceType'
import { Loader2, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'

// ─── Column definitions ───────────────────────────────────────────────────────

export type ColId = 'method' | 'status' | 'host' | 'path' | 'type' | 'timestamp' | 'duration'

interface ColDef {
  id: ColId
  label: string
  defaultVisible: boolean
  defaultWidth: number  // px min-width for flex cols, exact width for fixed cols
  minWidth: number
  align?: 'right' | 'center'
  fr?: number  // if set, col is flex and takes this many fr units
}

// Column order: fixed cols, then flex cols last
export const COLUMNS: ColDef[] = [
  { id: 'method',    label: 'Method',   defaultVisible: true,  defaultWidth: 62,   minWidth: 40 },
  { id: 'status',    label: 'Status',   defaultVisible: true,  defaultWidth: 72,   minWidth: 50 },
  { id: 'host',      label: 'Domain',   defaultVisible: true,  defaultWidth: 120,  minWidth: 80,  fr: 1 },
  { id: 'path',      label: 'Name',     defaultVisible: true,  defaultWidth: 120,  minWidth: 100, fr: 2 },
  { id: 'type',      label: 'Type',     defaultVisible: true,  defaultWidth: 78,   minWidth: 50 },
  { id: 'duration',  label: 'Time',     defaultVisible: true,  defaultWidth: 64,   minWidth: 40, align: 'right' },
  { id: 'timestamp', label: 'Started',  defaultVisible: true,  defaultWidth: 72,   minWidth: 52, align: 'right' },
]

export const DEFAULT_VISIBLE: Record<ColId, boolean> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, c.defaultVisible])
) as Record<ColId, boolean>

export const DEFAULT_WIDTHS: Record<ColId, number> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, c.defaultWidth])
) as Record<ColId, number>

// ─── Method color based on status code ───────────────────────────────────────

function getMethodColorByStatus(statusCode: number | null | undefined): string {
  if (!statusCode)            return 'text-muted-foreground'
  if (statusCode < 300)       return 'text-emerald-400'
  if (statusCode < 400)       return 'text-blue-400'
  if (statusCode < 500)       return 'text-orange-400'
  return 'text-red-400'
}

// ─── Resource type helpers ─────────────────────────────────────────────────────

const TYPE_COLORS: Record<ResourceType, string> = {
  document:   'text-blue-400',
  xhr:        'text-emerald-400',
  script:     'text-yellow-400',
  stylesheet: 'text-purple-400',
  image:      'text-pink-400',
  font:       'text-orange-400',
  media:      'text-cyan-400',
  websocket:  'text-red-400',
  other:      'text-muted-foreground',
}

const TYPE_LABELS: Record<ResourceType, string> = {
  document:   'Doc',
  xhr:        'XHR',
  script:     'JS',
  stylesheet: 'CSS',
  image:      'Img',
  font:       'Font',
  media:      'Media',
  websocket:  'WS',
  other:      'Other',
}

// ─── Resize handle ────────────────────────────────────────────────────────────

const ResizeHandle = memo(function ResizeHandle({
  colId,
  onDelta,
}: {
  colId: ColId
  onDelta: (id: ColId, delta: number) => void
}) {
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    let lastX = e.clientX
    const onMove = (me: MouseEvent) => {
      const delta = me.clientX - lastX
      lastX = me.clientX
      onDelta(colId, delta)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [colId, onDelta])

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 h-full w-3 cursor-col-resize z-10 select-none flex items-center justify-end pr-0.5 group/handle"
    >
      <div className="h-3.5 w-px bg-border group-hover/handle:bg-primary/60 transition-colors" />
    </div>
  )
})

// ─── Column picker ────────────────────────────────────────────────────────────

function ColumnPicker({
  visible,
  onToggle,
}: {
  visible: Record<ColId, boolean>
  onToggle: (id: ColId) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-6 w-6', open && 'bg-muted')}
        onClick={() => setOpen((o) => !o)}
        title="Toggle columns"
      >
        <SlidersHorizontal className="w-3 h-3" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-30 w-36 rounded-md border border-border bg-popover shadow-md p-1">
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                onClick={() => onToggle(col.id)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
              >
                <span className={cn(
                  'w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center',
                  visible[col.id] ? 'bg-primary border-primary' : 'border-border'
                )}>
                  {visible[col.id] && (
                    <svg className="w-2 h-2 text-primary-foreground" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {col.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Build grid-template-columns string ───────────────────────────────────────
// Fixed cols → exact px. Flex cols → minmax(minWidth px, Nfr).
// The column picker button (28px) is always the last grid column.

function buildGridTemplate(activeCols: ColDef[], widths: Record<ColId, number>): string {
  const parts = activeCols.map((col) => {
    if (col.fr) {
      const minW = widths[col.id] ?? col.minWidth
      return `minmax(${minW}px, ${col.fr}fr)`
    }
    return `${widths[col.id] ?? col.defaultWidth}px`
  })
  parts.push('28px') // column picker
  return parts.join(' ')
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface RequestTableProps {
  requests: HttpRequest[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading: boolean
  visible: Record<ColId, boolean>
  onToggleVisible: (id: ColId) => void
  widths: Record<ColId, number>
  onApplyDelta: (id: ColId, delta: number) => void
  onResend?: (request: HttpRequest) => void
}

export function RequestTable({
  requests,
  selectedId,
  onSelect,
  isLoading,
  visible,
  onToggleVisible,
  widths,
  onApplyDelta,
  onResend,
}: RequestTableProps) {
  const activeCols = COLUMNS.filter((c) => visible[c.id])
  const gridTemplate = buildGridTemplate(activeCols, widths)

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (!isLoading && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <span className="text-sm">No requests captured yet</span>
        <span className="text-xs">Start the proxy and browse the web</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div
        className="grid flex-shrink-0 border-b border-border bg-muted/30 text-muted-foreground font-mono text-xs select-none"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {activeCols.map((col, i) => (
          <div
            key={col.id}
            className={cn(
              'relative flex items-center h-7 px-2 overflow-hidden',
              i % 2 === 1 && 'bg-muted/40',
              col.align === 'right' && 'justify-end',
              col.align === 'center' && 'justify-center',
            )}
          >
            <span className="truncate">{col.label}</span>
            <ResizeHandle colId={col.id} onDelta={onApplyDelta} />
          </div>
        ))}
        {/* column picker lives in the last grid cell */}
        <div className="flex items-center justify-center h-7">
          <ColumnPicker visible={visible} onToggle={onToggleVisible} />
        </div>
      </div>

      {/* ── Rows ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs">
        {requests.map((req) => (
          <RequestRow
            key={req.id}
            request={req}
            isSelected={req.id === selectedId}
            onClick={() => onSelect(req.id)}
            onResend={onResend}
            activeCols={activeCols}
            widths={widths}
            gridTemplate={gridTemplate}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface RowProps {
  request: HttpRequest
  isSelected: boolean
  onClick: () => void
  onResend?: (request: HttpRequest) => void
  activeCols: ColDef[]
  widths: Record<ColId, number>
  gridTemplate: string
}

function RequestRow({ request, isSelected, onClick, onResend, activeCols, widths: _widths, gridTemplate }: RowProps) {
  const { method, url, host, path, statusCode, durationMs, timestamp, contentType } = request

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    document.addEventListener('mousedown', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [contextMenu])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  let displayPath = path || ''
  try {
    if (!displayPath) {
      const parsed = new URL(url)
      displayPath = parsed.pathname + parsed.search
    }
  } catch { /* use raw url */ }

  const timeStr = new Date(timestamp).toLocaleTimeString('en-GB', { hour12: false })
  const resourceType = classifyResourceType(contentType, url)

  const cellContent: Record<ColId, React.ReactNode> = {
    method: (
      <span className={cn('font-semibold', getMethodColorByStatus(statusCode))}>{method}</span>
    ),
    status: (
      <span className={getStatusColor(statusCode)}>{statusCode ?? '—'}</span>
    ),
    host: (
      <span className="text-blue-400/80 truncate" title={host}>{host}</span>
    ),
    path: (
      <span className="text-foreground/80 truncate" title={url}>{displayPath}</span>
    ),
    type: (
      <span className={cn(TYPE_COLORS[resourceType])}>{TYPE_LABELS[resourceType]}</span>
    ),
    timestamp: (
      <span className="text-muted-foreground">{timeStr}</span>
    ),
    duration: (
      <span className="text-muted-foreground tabular-nums">{formatDuration(durationMs)}</span>
    ),
  }

  return (
    <>
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className={cn(
          'grid cursor-pointer border-b border-border/30 hover:bg-muted/20 transition-colors select-none',
          isSelected && 'bg-primary/10 hover:bg-primary/15',
        )}
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {activeCols.map((col, i) => (
          <div
            key={col.id}
            className={cn(
              'flex items-center h-6 px-2 overflow-hidden',
              i % 2 === 1 && 'bg-muted/20',
              col.align === 'right'  && 'justify-end',
              col.align === 'center' && 'justify-center',
            )}
          >
            {cellContent[col.id]}
          </div>
        ))}
        {/* spacer cell for column picker column */}
        <div />
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-md border border-border bg-popover shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors text-left"
            onClick={() => {
              setContextMenu(null)
              onResend?.(request)
            }}
          >
            <RotateCcw className="w-3 h-3 text-muted-foreground" />
            Resend Request
          </button>
        </div>
      )}
    </>
  )
}

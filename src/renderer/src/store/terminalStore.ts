import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TerminalSession {
  sessionId: string
  terminalId: string | null
  // xterm objects — not serializable, stored as-is in memory
  term: import('@xterm/xterm').Terminal | null
  fitAddon: import('@xterm/addon-fit').FitAddon | null
  canvasAddon: import('@xterm/addon-canvas').CanvasAddon | null
  ready: boolean
  error: string | null
  // Whether init has been attempted (prevents double-init)
  initStarted: boolean
}

interface TerminalStore {
  sessions: Map<string, TerminalSession>

  // Ensure a slot exists for this sessionId (no-op if already exists)
  register: (sessionId: string) => void

  // Attach the xterm instance to a DOM container and start the PTY.
  // Safe to call multiple times — no-op if already initStarted.
  init: (sessionId: string, container: HTMLDivElement) => Promise<void>

  // Write data from PTY push event into the correct xterm instance
  receiveData: (terminalId: string, data: string) => void

  // Fit the terminal to its container
  fit: (sessionId: string) => void

  // Resize PTY to match current terminal cols/rows
  syncSize: (sessionId: string) => void

  // Fully tear down a terminal session (close PTY, dispose xterm)
  close: (sessionId: string) => void

  // Internal setter used by init
  _patch: (sessionId: string, patch: Partial<TerminalSession>) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  sessions: new Map(),

  register(sessionId) {
    const { sessions } = get()
    if (sessions.has(sessionId)) return
    const next = new Map(sessions)
    next.set(sessionId, {
      sessionId,
      terminalId: null,
      term: null,
      fitAddon: null,
      canvasAddon: null,
      ready: false,
      error: null,
      initStarted: false,
    })
    set({ sessions: next })
  },

  async init(sessionId, container) {
    const slot = get().sessions.get(sessionId)
    if (!slot) return
    if (slot.initStarted) return
    get()._patch(sessionId, { initStarted: true })

    try {
      const { Terminal } = await import('@xterm/xterm')
      const { FitAddon } = await import('@xterm/addon-fit')
      const { Unicode11Addon } = await import('@xterm/addon-unicode11')

      // Check slot still exists (could have been closed during async import)
      if (!get().sessions.has(sessionId)) return

      const term = new Terminal({
        allowProposedApi: true,
        fontSize: 13,
        fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
        fontWeight: '400',
        fontWeightBold: '700',
        lineHeight: 1.2,
        letterSpacing: 0,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 5000,
        convertEol: false,
        allowTransparency: false,
        drawBoldTextInBrightColors: false,
        theme: {
          background: '#09090b',
          foreground: '#e4e4e7',
          cursor: '#e4e4e7',
          cursorAccent: '#09090b',
          selectionBackground: '#3f3f4680',
          selectionForeground: '#e4e4e7',
          black: '#18181b',
          brightBlack: '#52525b',
          red: '#ef4444',
          brightRed: '#f87171',
          green: '#22c55e',
          brightGreen: '#4ade80',
          yellow: '#eab308',
          brightYellow: '#facc15',
          blue: '#3b82f6',
          brightBlue: '#60a5fa',
          magenta: '#a855f7',
          brightMagenta: '#c084fc',
          cyan: '#06b6d4',
          brightCyan: '#22d3ee',
          white: '#d4d4d8',
          brightWhite: '#fafafa',
        },
      })

      // Unicode11 must be loaded before open()
      const unicode11 = new Unicode11Addon()
      term.loadAddon(unicode11)
      term.unicode.activeVersion = '11'

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      // Attach to DOM — container must be visible at this point
      term.open(container)

      // Canvas renderer for crisp glyph rendering
      let canvasAddon: import('@xterm/addon-canvas').CanvasAddon | null = null
      try {
        const { CanvasAddon: CA } = await import('@xterm/addon-canvas')
        canvasAddon = new CA()
        term.loadAddon(canvasAddon)
      } catch {
        // fall back to DOM renderer silently
      }

      requestAnimationFrame(() => fitAddon.fit())

      // Forward keyboard/paste input to PTY
      term.onData((data) => {
        const current = get().sessions.get(sessionId)
        if (current?.terminalId) {
          window.api.terminal.write({ terminalId: current.terminalId, data })
        }
      })

      get()._patch(sessionId, { term, fitAddon, canvasAddon })

      // Create PTY on main process
      const result = await window.api.terminal.create({ sessionId })

      if (!get().sessions.has(sessionId)) {
        // Closed during async call
        try { canvasAddon?.dispose() } catch { /* ignore */ }
        term.dispose()
        return
      }

      if (result?.error || !result?.terminalId) {
        get()._patch(sessionId, { error: result?.error ?? 'Failed to create terminal', ready: false })
        try { canvasAddon?.dispose() } catch { /* ignore */ }
        term.dispose()
        return
      }

      get()._patch(sessionId, { terminalId: result.terminalId, ready: true })

      // Sync PTY size
      requestAnimationFrame(() => {
        fitAddon.fit()
        window.api.terminal.resize({
          terminalId: result.terminalId,
          cols: term.cols,
          rows: term.rows,
        })
      })

    } catch (err) {
      get()._patch(sessionId, { error: String(err) })
    }
  },

  receiveData(terminalId, data) {
    for (const slot of get().sessions.values()) {
      if (slot.terminalId === terminalId && slot.term) {
        slot.term.write(data)
        break
      }
    }
  },

  fit(sessionId) {
    const slot = get().sessions.get(sessionId)
    if (!slot?.fitAddon || !slot.term) return
    try {
      slot.fitAddon.fit()
    } catch { /* ignore */ }
  },

  syncSize(sessionId) {
    const slot = get().sessions.get(sessionId)
    if (!slot?.fitAddon || !slot.term || !slot.terminalId) return
    try {
      slot.fitAddon.fit()
      window.api.terminal.resize({
        terminalId: slot.terminalId,
        cols: slot.term.cols,
        rows: slot.term.rows,
      })
    } catch { /* ignore */ }
  },

  close(sessionId) {
    const slot = get().sessions.get(sessionId)
    if (!slot) return

    if (slot.terminalId) {
      window.api.terminal.close({ terminalId: slot.terminalId }).catch(() => {})
    }
    // Dispose CanvasAddon before Terminal to avoid internal re-create crash
    try { slot.canvasAddon?.dispose() } catch { /* ignore */ }
    try { slot.term?.dispose() } catch { /* ignore */ }

    const next = new Map(get().sessions)
    next.delete(sessionId)
    set({ sessions: next })
  },

  _patch(sessionId, patch) {
    const { sessions } = get()
    const slot = sessions.get(sessionId)
    if (!slot) return
    const next = new Map(sessions)
    next.set(sessionId, { ...slot, ...patch })
    set({ sessions: next })
  },
}))

// ─── Global PTY data listener (single, app-level) ─────────────────────────────
// Registered once when the module loads. Routes incoming PTY data to the
// correct xterm instance via the store, regardless of which component is mounted.
window.api.on.terminalData((data: unknown) => {
  const d = data as { terminalId: string; data: string }
  useTerminalStore.getState().receiveData(d.terminalId, d.data)
})

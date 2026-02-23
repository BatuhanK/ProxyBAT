import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { SplashScreen } from './components/SplashScreen'
import { StartSessionModal } from './components/StartSessionModal'
import { TrafficPage } from './pages/Traffic/TrafficPage'
import { SessionsPage } from './pages/Sessions/SessionsPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import { ScriptsPage } from './pages/Scripts/ScriptsPage'
import { ChatPage } from './pages/Chat/ChatPage'
import { ResendPage } from './pages/Resend/ResendPage'
import { useProxyStore } from './store/proxyStore'
import { useSessionStore } from './store/sessionStore'
import { useAgentStore } from './store/agentStore'
import { useScriptLogStore } from './store/scriptLogStore'
import type { ScriptLogLevel } from './store/scriptLogStore'
import { useConnectionErrorStore } from './store/connectionErrorStore'
import type { ConnectionErrorType } from './store/connectionErrorStore'
import { ConnectionErrorToast } from './components/ConnectionErrorToast'
import { TooltipProvider } from './components/ui/tooltip'
import { create } from 'zustand'

// Navigation store
interface NavState {
  page: 'traffic' | 'sessions' | 'settings' | 'scripts' | 'chat' | 'resend'
  setPage: (page: NavState['page']) => void
}

export const useNavStore = create<NavState>((set) => ({
  page: 'traffic',
  setPage: (page) => set({ page })
}))

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const { page } = useNavStore()
  const { fetchStatus, setStatus, setPort, setActiveSessionId, showStartModal } = useProxyStore()
  const { fetchSessions, appendRequest } = useSessionStore()
  const { handleAgentEvent, finalizeStream, fetchSessions: fetchAgentSessions, updateSessionTitle } = useAgentStore()
  const { appendLog } = useScriptLogStore()
  const { appendError } = useConnectionErrorStore()

  useEffect(() => {
    fetchStatus()
    fetchSessions()
    fetchAgentSessions()

    // Subscribe to push events from main process
    const unsubProxy = window.api.on.proxyStatusChanged((data) => {
      setStatus(data.status)
      setPort(data.port)
      setActiveSessionId(data.activeSessionId)
      fetchSessions()
    })

    const unsubRequest = window.api.on.requestCaptured((data) => {
      appendRequest(data)
    })

    const unsubAgent = window.api.on.agentEvent((data) => {
      handleAgentEvent(data)
    })

    const unsubAgentDone = window.api.on.agentTurnDone((data) => {
      finalizeStream(data?.sessionId)
    })

    const unsubAgentTitle = window.api.on.agentTitleUpdated((data) => {
      updateSessionTitle(data.sessionId, data.title)
    })

    const unsubScriptLog = window.api.on.scriptLog((data) => {
      appendLog({
        script: data.script,
        level: (data.level as ScriptLogLevel) ?? 'info',
        message: data.message,
        timestamp: data.timestamp ?? Date.now(),
      })
    })

    const unsubConnectionError = window.api.on.connectionError((data) => {
      appendError({
        host: data.host,
        reason: data.reason,
        errorType: data.errorType as ConnectionErrorType,
        timestamp: data.timestamp ?? Date.now(),
      })
    })

    return () => {
      unsubProxy()
      unsubRequest()
      unsubAgent()
      unsubAgentDone()
      unsubAgentTitle()
      unsubScriptLog()
      unsubConnectionError()
    }
  }, [])

  // Pages that must stay mounted across tab switches (to preserve terminal sessions etc.)
  const alwaysMounted: Array<NavState['page']> = ['chat', 'resend']

  // Pages that are only rendered when active (lightweight, no long-lived state)
  const lazyPages: Partial<Record<NavState['page'], React.ReactNode>> = {
    traffic: <TrafficPage />,
    sessions: <SessionsPage />,
    settings: <SettingsPage />,
    scripts: <ScriptsPage />,
  }

  return (
    <TooltipProvider>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative">
          {/* Always-mounted pages: hidden via CSS, never unmounted */}
          {alwaysMounted.map((p) => (
            <div key={p} className="absolute inset-0 flex-col" style={{ display: page === p ? 'flex' : 'none' }}>
              {p === 'chat' && <ChatPage />}
              {p === 'resend' && <ResendPage />}
            </div>
          ))}
          {/* Lazy pages: only rendered when active */}
          {!alwaysMounted.includes(page) && lazyPages[page]}
        </main>
      </div>
      {/* Connection error toasts — shown globally over all pages */}
      <ConnectionErrorToast />
      {/* Start session modal */}
      {showStartModal && <StartSessionModal />}
    </TooltipProvider>
  )
}

export default App

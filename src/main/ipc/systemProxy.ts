import { ipcMain } from 'electron'
import { execSync } from 'child_process'
import { IPC } from '@shared/ipc-contracts'
import type {
  IpcSystemProxySet,
  IpcSystemProxyUnset,
  SystemProxyServiceStatus,
} from '@shared/ipc-contracts'

// Services to skip — virtual, VPN, or loopback interfaces
const SKIP_PATTERNS = [
  /thunderbolt bridge/i,
  /bluetooth/i,
  /vpn/i,
  /loopback/i,
]

function shouldSkip(service: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(service))
}

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim()
  } catch {
    return ''
  }
}

function getServices(): string[] {
  const out = run('networksetup -listallnetworkservices')
  return out
    .split('\n')
    .slice(1) // first line is the asterisk notice
    .map((l) => l.replace(/^\*\s*/, '').trim())
    .filter((l) => l.length > 0 && !shouldSkip(l))
}

function parseProxyOutput(out: string): { enabled: boolean; host: string; port: number | null } {
  const lines = out.split('\n')
  const get = (prefix: string) =>
    lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()))?.split(':').slice(1).join(':').trim() ?? ''

  const enabled = get('Enabled:').toLowerCase() === 'yes'
  const host = get('Server:')
  const portStr = get('Port:')
  const port = portStr && portStr !== '0' ? parseInt(portStr, 10) : null

  return { enabled, host, port }
}

function getServiceStatus(service: string): SystemProxyServiceStatus {
  const httpOut = run(`networksetup -getwebproxy "${service}"`)
  const httpsOut = run(`networksetup -getsecurewebproxy "${service}"`)

  const http = parseProxyOutput(httpOut)
  const https = parseProxyOutput(httpsOut)

  return {
    service,
    httpEnabled: http.enabled,
    httpHost: http.host,
    httpPort: http.port,
    httpsEnabled: https.enabled,
    httpsHost: https.host,
    httpsPort: https.port,
  }
}

/**
 * Returns true if ANY eligible network service has HTTP or HTTPS proxy enabled.
 * Used by the proxy start/stop handlers to auto-manage system proxy state.
 */
export function isSystemProxySet(): boolean {
  try {
    const services = getServices()
    return services.some((service) => {
      const status = getServiceStatus(service)
      return status.httpEnabled || status.httpsEnabled
    })
  } catch {
    return false
  }
}

/**
 * Disables HTTP and HTTPS proxy on all eligible network services.
 */
export function unsetSystemProxy(): void {
  try {
    const services = getServices()
    for (const service of services) {
      run(`networksetup -setwebproxystate "${service}" off`)
      run(`networksetup -setsecurewebproxystate "${service}" off`)
    }
  } catch {
    // best-effort
  }
}

/**
 * Enables HTTP and HTTPS proxy on all eligible network services.
 */
export function setSystemProxy(host: string, port: number): void {
  try {
    const services = getServices()
    for (const service of services) {
      run(`networksetup -setwebproxy "${service}" ${host} ${port}`)
      run(`networksetup -setsecurewebproxy "${service}" ${host} ${port}`)
      run(`networksetup -setwebproxystate "${service}" on`)
      run(`networksetup -setsecurewebproxystate "${service}" on`)
    }
  } catch {
    // best-effort
  }
}

export function registerSystemProxyHandlers(): void {
  ipcMain.handle(IPC.SYSTEM_PROXY.GET_STATUS, async () => {
    try {
      const services = getServices()
      const statuses = services.map(getServiceStatus)
      return { services: statuses }
    } catch (err) {
      return { services: [], error: String(err) }
    }
  })

  ipcMain.handle(IPC.SYSTEM_PROXY.SET, async (_event, params: IpcSystemProxySet) => {
    const host = params.host ?? '127.0.0.1'
    const port = params.port
    try {
      const services = getServices()
      for (const service of services) {
        run(`networksetup -setwebproxy "${service}" ${host} ${port}`)
        run(`networksetup -setsecurewebproxy "${service}" ${host} ${port}`)
        run(`networksetup -setwebproxystate "${service}" on`)
        run(`networksetup -setsecurewebproxystate "${service}" on`)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(IPC.SYSTEM_PROXY.UNSET, async (_event, _params: IpcSystemProxyUnset) => {
    try {
      const services = getServices()
      for (const service of services) {
        run(`networksetup -setwebproxystate "${service}" off`)
        run(`networksetup -setsecurewebproxystate "${service}" off`)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}

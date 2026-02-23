import { execFile } from 'child_process'
import { promisify } from 'util'
import { ProxyManager } from '../../../proxy/ProxyManager'
import { SettingsStore } from '../../../storage/SettingsStore'

const execFileAsync = promisify(execFile)

/**
 * Escapes a string using ANSI-C quoting ($'...') for safe shell usage.
 * Handles special characters including quotes, newlines, and control chars.
 */
function ansiQuote(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    const code = s.charCodeAt(i)
    if (c === '\\') { out += '\\\\'; continue }
    if (c === "'")  { out += "\\'";  continue }
    if (c === '\n') { out += '\\n';  continue }
    if (c === '\r') { out += '\\r';  continue }
    if (c === '\t') { out += '\\t';  continue }
    if (code < 0x20 || code === 0x7f) {
      out += '\\x' + code.toString(16).padStart(2, '0')
      continue
    }
    out += c
  }
  return `$'${out}'`
}

/**
 * Get the proxy URL to route requests through.
 * Uses the active proxy port or falls back to settings.
 */
export function getProxyUrl(): string {
  const port =
    ProxyManager.getInstance().getActivePort() ??
    SettingsStore.getInstance().getProxySettings().port
  return `http://127.0.0.1:${port}`
}

/**
 * Fetch a URL through the proxy with curl subprocess.
 * Returns status, headers, body excerpt, and duration in milliseconds.
 * Uses MITM proxy to properly handle TLS and capture traffic.
 */
export async function fetchViaProxy(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | null,
): Promise<{ status: number; responseHeaders: Record<string, string>; body: string; durationMs: number }> {
  const proxyUrl = getProxyUrl()
  const start = Date.now()

  const curlBinary = SettingsStore.getInstance().getCurlBinary()

  // Build header arguments with proper escaping and cookie fix
  const headerArgs: string[] = []
  for (const [k, v] of Object.entries(headers)) {
    let headerValue = v
    // Cookie header must use semicolons to separate cookies, not commas
    if (k.toLowerCase() === 'cookie') {
      headerValue = headerValue.replace(/,\s*/g, '; ')
    }
    headerArgs.push('-H', ansiQuote(`${k}: ${headerValue}`))
  }

  const curlArgs = [
    '--proxy', proxyUrl,
    '--insecure',         // trust our MITM cert
    '--silent',
    '--include',          // include response headers
    '--max-time', '30',
    '-X', ansiQuote(method),
    ...headerArgs,
    ...(body ? ['--data-raw', ansiQuote(body)] : []),
    ansiQuote(url),
  ]

  const { stdout } = await execFileAsync(curlBinary, curlArgs, { timeout: 35_000 })

  // Parse curl --include output: headers come before blank line
  const blankLine = stdout.indexOf('\r\n\r\n')
  const headerSection = blankLine >= 0 ? stdout.slice(0, blankLine) : stdout
  const bodySection = blankLine >= 0 ? stdout.slice(blankLine + 4) : ''

  const statusMatch = headerSection.match(/^HTTP\/[\d.]+ (\d+)/)
  const status = statusMatch ? parseInt(statusMatch[1], 10) : 0

  const responseHeaders: Record<string, string> = {}
  for (const line of headerSection.split('\r\n').slice(1)) {
    const colon = line.indexOf(':')
    if (colon > 0) {
      const key = line.slice(0, colon).trim().toLowerCase()
      const val = line.slice(colon + 1).trim()
      responseHeaders[key] = val
    }
  }

  return {
    status,
    responseHeaders,
    body: bodySection.slice(0, 4096),
    durationMs: Date.now() - start,
  }
}

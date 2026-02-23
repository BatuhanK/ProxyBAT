import type { HttpRequest } from '@shared/types'

/**
 * Escapes a string using ANSI-C quoting ($'...') which handles all special
 * characters including newlines, tabs, null bytes, and single quotes.
 *
 * This is supported by bash and zsh (the two most common shells on macOS/Linux).
 * It is safer than plain single-quote escaping for multi-line bodies and
 * binary-ish content (e.g. JSON with escaped chars, URL-encoded data).
 *
 * Characters escaped:
 *   \  → \\
 *   '  → \'
 *   \n → \n  (literal backslash-n so the shell interprets it as newline)
 *   \r → \r
 *   \t → \t
 *   NUL and other control chars → \xHH hex escapes
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
 * Builds a curl command string from an HttpRequest + optional body string.
 *
 * Uses ANSI-C quoting ($'...') for all arguments so that:
 * - Single quotes in values are properly escaped
 * - Newlines / carriage returns in request bodies don't break the command
 * - The output is copy-pasteable into bash or zsh without modification
 *
 * Flags:
 *   -s   suppress progress meter
 *   -i   include response headers in output
 *   -k   skip TLS verification (only for SSL-intercepted requests)
 */
export function buildCurlCommand(request: HttpRequest, body?: string | null, curlBinary?: string): string {
  const parts: string[] = [curlBinary && curlBinary.trim() ? curlBinary.trim() : 'curl']

  // Silent + include response headers
  parts.push('-si')

  // Skip TLS verification for MITM-intercepted requests
  if (request.sslIntercepted) {
    parts.push('-k')
  }

  // Method — omit -X GET since it is the curl default
  if (request.method !== 'GET') {
    parts.push(`-X ${ansiQuote(request.method)}`)
  }

  // Request headers
  const headers = request.requestHeaders ?? {}
  for (const [name, value] of Object.entries(headers)) {
    // Skip HTTP/2 pseudo-headers and hop-by-hop headers curl manages itself
    if (name.startsWith(':')) continue
    if (name.toLowerCase() === 'content-length') continue
    if (name.toLowerCase() === 'transfer-encoding') continue

    let headerValue = String(value)

    // Cookie header must use semicolons to separate cookies, not commas
    if (name.toLowerCase() === 'cookie') {
      headerValue = headerValue.replace(/,\s*/g, '; ')
    }

    // Build "Name: Value" as a single ANSI-C quoted string
    parts.push(`-H ${ansiQuote(`${name}: ${headerValue}`)}`)
  }

  // Body — use --data-raw to avoid @file interpretation
  if (body) {
    parts.push(`--data-raw ${ansiQuote(body)}`)
  }

  // URL
  parts.push(ansiQuote(request.url))

  // Join with backslash-newline for readability
  return parts.join(' \\\n  ')
}

// ─── Resource Type Classification ────────────────────────────────────────────
// Shared between main process (agent tools) and renderer (UI filtering).
// Derives a resource type from the content-type header + URL extension.

export type ResourceType =
  | 'document'
  | 'xhr'
  | 'script'
  | 'stylesheet'
  | 'image'
  | 'font'
  | 'media'
  | 'websocket'
  | 'other'

// Asset types (non-document, non-data) — useful for filtering in security tools
export const ASSET_TYPES: ResourceType[] = [
  'script',
  'stylesheet',
  'image',
  'font',
  'media',
]

// content_type LIKE patterns for each resource type — used for DB-level filtering
export const RESOURCE_TYPE_CONTENT_PATTERNS: Record<ResourceType, string[]> = {
  document: ['text/html%', 'application/xhtml%'],
  xhr: ['application/json%', 'application/x-www-form-urlencoded%', 'text/plain%', 'application/xml%', 'text/xml%'],
  script: ['text/javascript%', 'application/javascript%', 'application/x-javascript%'],
  stylesheet: ['text/css%'],
  image: ['image/%'],
  font: ['font/%', 'application/font%', 'application/x-font%'],
  media: ['audio/%', 'video/%'],
  websocket: [],  // websocket is protocol-level, not content-type
  other: [],
}

const SCRIPT_EXTS = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'])
const STYLE_EXTS = new Set(['.css', '.scss', '.sass', '.less'])
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.avif', '.bmp'])
const FONT_EXTS = new Set(['.woff', '.woff2', '.ttf', '.otf', '.eot'])
const MEDIA_EXTS = new Set(['.mp4', '.webm', '.ogg', '.mp3', '.wav', '.flac', '.avi', '.mov'])
const DOC_EXTS = new Set(['.html', '.htm', '.xhtml'])

function getUrlExt(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const dot = pathname.lastIndexOf('.')
    if (dot === -1) return ''
    const ext = pathname.slice(dot).toLowerCase().split('?')[0]
    return ext
  } catch {
    const dot = url.lastIndexOf('.')
    if (dot === -1) return ''
    return url.slice(dot).toLowerCase().split('?')[0]
  }
}

export function classifyResourceType(
  contentType: string | null | undefined,
  url: string
): ResourceType {
  const ct = (contentType ?? '').toLowerCase()

  // WebSocket: detected by ws:// or wss:// scheme
  if (url.startsWith('ws://') || url.startsWith('wss://')) return 'websocket'

  // Content-type based classification (most reliable)
  if (ct) {
    if (ct.includes('text/html') || ct.includes('application/xhtml')) return 'document'
    if (ct.includes('text/css')) return 'stylesheet'
    if (
      ct.includes('javascript') ||
      ct.includes('text/js') ||
      ct.includes('application/x-javascript')
    ) return 'script'
    if (ct.startsWith('image/')) return 'image'
    if (
      ct.startsWith('font/') ||
      ct.includes('application/font') ||
      ct.includes('application/x-font') ||
      ct.includes('font-woff')
    ) return 'font'
    if (ct.startsWith('audio/') || ct.startsWith('video/')) return 'media'
    if (
      ct.includes('application/json') ||
      ct.includes('application/x-www-form-urlencoded') ||
      ct.includes('application/xml') ||
      ct.includes('text/xml') ||
      ct.includes('multipart/form-data') ||
      ct.includes('text/plain')
    ) return 'xhr'
  }

  // Fall back to URL extension
  const ext = getUrlExt(url)
  if (ext) {
    if (DOC_EXTS.has(ext)) return 'document'
    if (SCRIPT_EXTS.has(ext)) return 'script'
    if (STYLE_EXTS.has(ext)) return 'stylesheet'
    if (IMAGE_EXTS.has(ext)) return 'image'
    if (FONT_EXTS.has(ext)) return 'font'
    if (MEDIA_EXTS.has(ext)) return 'media'
  }

  return 'other'
}

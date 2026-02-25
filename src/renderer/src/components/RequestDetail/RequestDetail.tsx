import { useState, useEffect, useCallback } from 'react'
import type { HttpRequest } from '@shared/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { X, Copy, Terminal, Eye, Code } from 'lucide-react'
import { cn, getStatusColor, getMethodColor, formatDuration } from '@renderer/lib/utils'
import { buildCurlCommand } from '@renderer/lib/curlBuilder'

interface Props {
  request: HttpRequest
  onClose: () => void
}

export function RequestDetail({ request, onClose }: Props) {
  const [requestBody, setRequestBody] = useState<string | null>(null)
  const [responseBody, setResponseBody] = useState<string | null>(null)
  const [loadingReqBody, setLoadingReqBody] = useState(false)
  const [loadingResBody, setLoadingResBody] = useState(false)
  const [curlCopied, setCurlCopied] = useState(false)
  const [curlBinary, setCurlBinary] = useState<string>('curl')

  useEffect(() => {
    window.api.settings.get().then((result) => {
      if (result.settings?.curlBinary) setCurlBinary(result.settings.curlBinary)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setRequestBody(null)
    setResponseBody(null)
    setCurlCopied(false)
  }, [request.id])

  const loadRequestBody = async () => {
    if (!request.requestBodyKey || loadingReqBody) return
    setLoadingReqBody(true)
    try {
      const result = await window.api.request.getBody({ key: request.requestBodyKey })
      setRequestBody(result.body)
    } catch {
      setRequestBody('[Error loading body]')
    } finally {
      setLoadingReqBody(false)
    }
  }

  const loadResponseBody = async () => {
    if (!request.responseBodyKey || loadingResBody) return
    setLoadingResBody(true)
    try {
      const result = await window.api.request.getBody({ key: request.responseBodyKey })
      setResponseBody(result.body)
    } catch {
      setResponseBody('[Error loading body]')
    } finally {
      setLoadingResBody(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const copyAsCurl = useCallback(async () => {
    // If request body hasn't been loaded yet, load it first
    let body = requestBody
    if (request.requestBodyKey && body === null) {
      try {
        const result = await window.api.request.getBody({ key: request.requestBodyKey })
        body = result.body
        setRequestBody(body)
      } catch {
        body = null
      }
    }
    const curl = buildCurlCommand(request, body, curlBinary)
    navigator.clipboard.writeText(curl).catch(() => {})
    setCurlCopied(true)
    setTimeout(() => setCurlCopied(false), 2000)
  }, [request, requestBody, curlBinary])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
        <span className={cn('text-xs font-bold', getMethodColor(request.method))}>
          {request.method}
        </span>
        <span className={cn('text-xs font-mono font-bold', getStatusColor(request.statusCode))}>
          {request.statusCode ?? '—'}
        </span>
        <span className="flex-1 text-xs text-muted-foreground truncate font-mono" title={request.url}>
          {request.url}
        </span>
        <span className="text-xs text-muted-foreground">{formatDuration(request.durationMs)}</span>
        {request.sslIntercepted && (
          <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30 py-0">
            SSL
          </Badge>
        )}
        {/* Copy as curl button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-6 w-6', curlCopied && 'text-green-400')}
          onClick={copyAsCurl}
          title="Copy as curl command"
        >
          <Terminal className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="request" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="flex-shrink-0 mx-3 mt-2 self-start h-7">
          <TabsTrigger value="request" className="text-xs h-6">Request</TabsTrigger>
          <TabsTrigger value="response" className="text-xs h-6">Response</TabsTrigger>
          <TabsTrigger value="raw" className="text-xs h-6">Raw</TabsTrigger>
        </TabsList>

        {/* Request Tab */}
        <TabsContent value="request" className="flex-1 overflow-auto px-3 pb-3 mt-2">
          <SectionHeader title="URL" />
          <div className="font-mono text-xs bg-muted/30 rounded p-2 mb-3 break-all text-foreground/80">
            {request.url}
          </div>

          <SectionHeader title="Request Headers" onCopy={() => copyToClipboard(headersToText(request.requestHeaders))} />
          <HeadersTable headers={request.requestHeaders} />

          {request.requestBodyKey && (
            <div className="mt-3">
              <SectionHeader title="Request Body" onCopy={requestBody ? () => copyToClipboard(requestBody) : undefined} />
              <BodyViewer
                body={requestBody}
                bodySize={request.requestBodySize}
                loading={loadingReqBody}
                onLoad={loadRequestBody}
                contentType={request.requestHeaders['content-type'] || request.requestHeaders['Content-Type']}
              />
            </div>
          )}
        </TabsContent>

        {/* Response Tab */}
        <TabsContent value="response" className="flex-1 overflow-auto px-3 pb-3 mt-2">
          <div className="flex items-center gap-3 mb-3">
            <span className={cn('text-sm font-bold', getStatusColor(request.statusCode))}>
              {request.statusCode ?? 'No response'}
            </span>
            <span className="text-xs text-muted-foreground">{formatDuration(request.durationMs)}</span>
            {request.contentType && (
              <Badge variant="outline" className="text-xs py-0">{request.contentType.split(';')[0]}</Badge>
            )}
          </div>

          <SectionHeader title="Response Headers" onCopy={() => copyToClipboard(headersToText(request.responseHeaders))} />
          <HeadersTable headers={request.responseHeaders} />

          {request.responseBodyKey && (
            <div className="mt-3">
              <SectionHeader title="Response Body" onCopy={responseBody ? () => copyToClipboard(responseBody) : undefined} />
              <BodyViewer
                body={responseBody}
                bodySize={request.responseBodySize}
                loading={loadingResBody}
                onLoad={loadResponseBody}
                contentType={request.contentType}
              />
            </div>
          )}
        </TabsContent>

        {/* Raw Tab */}
        <TabsContent value="raw" className="flex-1 overflow-auto px-3 pb-3 mt-2">
          <pre className="text-xs font-mono bg-muted/30 rounded p-3 whitespace-pre-wrap break-all text-foreground/80">
            {buildRawRequest(request)}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SectionHeader({ title, onCopy }: { title: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
      {onCopy && (
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onCopy}>
          <Copy className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
}

function HeadersTable({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers)
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground italic mb-3">No headers</p>
  }
  return (
    <div className="rounded border border-border overflow-hidden mb-3">
      {entries.map(([key, value], i) => (
        <div key={key} className={cn('flex text-xs font-mono', i % 2 === 0 ? 'bg-muted/20' : '')}>
          <span className="w-1/3 flex-shrink-0 px-2 py-1 text-primary/80 font-medium border-r border-border truncate" title={key}>
            {key}
          </span>
          <span className="flex-1 px-2 py-1 text-foreground/70 break-all">
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

interface BodyViewerProps {
  body: string | null
  bodySize: number | null
  loading: boolean
  onLoad: () => void
  contentType: string | null | undefined
}

type ViewMode = 'preview' | 'source'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getContentTypeCategory(contentType: string | null | undefined): 'html' | 'xml' | 'json' | 'javascript' | 'image' | 'text' | 'binary' {
  if (!contentType) return 'text'
  const ct = contentType.toLowerCase()
  if (ct.includes('text/html') || ct.includes('application/xhtml')) return 'html'
  if (ct.includes('xml') || ct.includes('application/atom') || ct.includes('application/rss')) return 'xml'
  if (ct.includes('json')) return 'json'
  if (ct.includes('javascript') || ct.includes('application/javascript') || ct.includes('application/x-javascript')) return 'javascript'
  if (ct.includes('image/')) return 'image'
  if (ct.includes('audio/') || ct.includes('video/') || ct.includes('application/pdf')) return 'binary'
  return 'text'
}

function formatXml(xml: string): string {
  let formatted = ''
  let indent = 0
  const tab = '  '
  xml.split(/>\s*</).forEach(function (node) {
    if (node.match(/^\/\w/)) indent--
    formatted += new Array(indent + 1).join(tab) + '<' + node + '>\r\n'
    if (node.match(/^<?\w[^>]*[^\/]$/)) indent++
  })
  return formatted.substring(1, formatted.length - 3)
}

// Syntax highlighting components
interface Token {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'tag' | 'attribute' | 'text' | 'operator'
  value: string
}

function tokenizeJson(json: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  
  while (i < json.length) {
    const char = json[i]
    
    // Skip whitespace
    if (/\s/.test(char)) {
      tokens.push({ type: 'text', value: char })
      i++
      continue
    }
    
    // Punctuation
    if (/[{}\[\]:,]/.test(char)) {
      tokens.push({ type: 'punctuation', value: char })
      i++
      continue
    }
    
    // Strings (keys and values)
    if (char === '"') {
      let str = char
      i++
      while (i < json.length && json[i] !== '"') {
        if (json[i] === '\\') {
          str += json[i]
          i++
        }
        str += json[i]
        i++
      }
      str += json[i] || ''
      i++
      
      // Check if this is a key (followed by :)
      const nextNonSpace = json.slice(i).match(/^\s*/)?.[0]?.length || 0
      const nextChar = json[i + nextNonSpace]
      if (nextChar === ':') {
        tokens.push({ type: 'key', value: str })
      } else {
        tokens.push({ type: 'string', value: str })
      }
      continue
    }
    
    // Numbers
    if (/[-\d]/.test(char)) {
      let num = ''
      while (i < json.length && /[-\d.eE+]/.test(json[i])) {
        num += json[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
      continue
    }
    
    // Booleans and null
    if (json.slice(i).startsWith('true') || json.slice(i).startsWith('false')) {
      const val = json.slice(i).startsWith('true') ? 'true' : 'false'
      tokens.push({ type: 'boolean', value: val })
      i += val.length
      continue
    }
    
    if (json.slice(i).startsWith('null')) {
      tokens.push({ type: 'null', value: 'null' })
      i += 4
      continue
    }
    
    // Default: text
    tokens.push({ type: 'text', value: char })
    i++
  }
  
  return tokens
}

function tokenizeFormData(formData: string): Token[] {
  const tokens: Token[] = []
  const lines = formData.split('\n')
  
  lines.forEach((line, idx) => {
    const equalsIdx = line.indexOf('=')
    if (equalsIdx > 0) {
      // Key
      tokens.push({ type: 'key', value: line.slice(0, equalsIdx) })
      // Operator
      tokens.push({ type: 'operator', value: '=' })
      // Value
      const value = line.slice(equalsIdx + 1)
      // Check if value is JSON
      if ((value.startsWith('{') || value.startsWith('[')) && value.includes('"')) {
        try {
          JSON.parse(value)
          // It's valid JSON, tokenize it
          const jsonTokens = tokenizeJson(value)
          tokens.push(...jsonTokens)
        } catch {
          tokens.push({ type: 'string', value })
        }
      } else {
        tokens.push({ type: 'string', value })
      }
    } else {
      tokens.push({ type: 'text', value: line })
    }
    
    if (idx < lines.length - 1) {
      tokens.push({ type: 'text', value: '\n' })
    }
  })
  
  return tokens
}

function tokenizeXml(xml: string): Token[] {
  const tokens: Token[] = []
  const regex = /(<\/?)([\w:]+)([^>]*)?(\/?>)|([^<]+)/g
  let match
  
  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) {
      // Tag start
      tokens.push({ type: 'punctuation', value: match[1] })
      // Tag name
      tokens.push({ type: 'tag', value: match[2] })
      // Attributes
      if (match[3]) {
        const attrRegex = /(\s*)([\w:]+)(=)("[^"]*")/g
        let attrMatch
        while ((attrMatch = attrRegex.exec(match[3])) !== null) {
          tokens.push({ type: 'text', value: attrMatch[1] })
          tokens.push({ type: 'attribute', value: attrMatch[2] })
          tokens.push({ type: 'operator', value: attrMatch[3] })
          tokens.push({ type: 'string', value: attrMatch[4] })
        }
      }
      // Tag end
      tokens.push({ type: 'punctuation', value: match[4] })
    } else if (match[5]) {
      // Text content
      tokens.push({ type: 'text', value: match[5] })
    }
  }
  
  return tokens
}

function getTokenColor(type: Token['type']): string {
  switch (type) {
    case 'key':
      return 'text-sky-400' // Light blue for keys
    case 'string':
      return 'text-emerald-400' // Green for strings
    case 'number':
      return 'text-amber-400' // Orange/amber for numbers
    case 'boolean':
      return 'text-purple-400' // Purple for booleans
    case 'null':
      return 'text-red-400' // Red for null
    case 'tag':
      return 'text-pink-400' // Pink for XML tags
    case 'attribute':
      return 'text-sky-300' // Light blue for XML attributes
    case 'operator':
      return 'text-slate-400' // Gray for operators (=)
    case 'punctuation':
      return 'text-slate-300' // Light gray for punctuation
    default:
      return 'text-slate-300' // Default text color
  }
}

function SyntaxHighlighted({ text, language }: { text: string; language: string }) {
  let tokens: Token[] = []
  
  if (language === 'json') {
    tokens = tokenizeJson(text)
  } else if (language === 'form') {
    tokens = tokenizeFormData(text)
  } else if (language === 'xml') {
    tokens = tokenizeXml(text)
  } else {
    // For other languages, just return as-is
    return <>{text}</>
  }
  
  return (
    <>
      {tokens.map((token, idx) => (
        <span key={idx} className={getTokenColor(token.type)}>
          {token.value}
        </span>
      ))}
    </>
  )
}

function tryFormatFormData(body: string, contentType: string | null | undefined): string | null {
  const ct = contentType?.toLowerCase() || ''
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    try {
      // Try to decode and format as key=value pairs
      const params = new URLSearchParams(body)
      const formatted: string[] = []
      params.forEach((value, key) => {
        // Try to pretty print JSON values
        let displayValue = value
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            displayValue = JSON.stringify(JSON.parse(value), null, 2)
          } catch {
            // Not valid JSON, show as-is
          }
        }
        formatted.push(`${key}=${displayValue}`)
      })
      return formatted.join('\n')
    } catch {
      return null
    }
  }
  return null
}

function tryDetectAndFormat(body: string): { formatted: string; language: string } {
  // Try to detect JSON even without content-type
  const trimmed = body.trim()
  
  // Check for URL-encoded form data
  if (trimmed.includes('=') && trimmed.includes('&')) {
    try {
      const params = new URLSearchParams(trimmed)
      const formatted: string[] = []
      params.forEach((value, key) => {
        let displayValue = value
        // Try to pretty print JSON values
        if ((value.startsWith('{') || value.startsWith('[')) && value.includes('"')) {
          try {
            displayValue = JSON.stringify(JSON.parse(value), null, 2)
          } catch {
            // Not valid JSON, show as-is
          }
        }
        formatted.push(`${key}=${displayValue}`)
      })
      return { formatted: formatted.join('\n'), language: 'form' }
    } catch {
      // Not valid form data
    }
  }
  
  // Try JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return { formatted: JSON.stringify(JSON.parse(trimmed), null, 2), language: 'json' }
    } catch {
      // Not valid JSON
    }
  }
  
  // Try XML
  if (trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && trimmed.endsWith('>'))) {
    try {
      return { formatted: formatXml(trimmed), language: 'xml' }
    } catch {
      // Not valid XML
    }
  }
  
  return { formatted: body, language: 'text' }
}

function BodyViewer({ body, bodySize, loading, onLoad, contentType }: BodyViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const category = getContentTypeCategory(contentType)
  const LARGE_BODY_THRESHOLD = 10 * 1024 // 10KB

  // Determine if we should show the load button or auto-load
  const shouldShowLoadButton = body === null && !loading && bodySize !== null && bodySize > LARGE_BODY_THRESHOLD
  const shouldAutoLoad = body === null && !loading && (bodySize === null || bodySize <= LARGE_BODY_THRESHOLD)

  // Auto-load small bodies
  useEffect(() => {
    if (shouldAutoLoad) {
      onLoad()
    }
  }, [shouldAutoLoad, onLoad])

  if (shouldShowLoadButton) {
    return (
      <Button variant="outline" size="sm" className="text-xs h-7" onClick={onLoad}>
        Load body ({formatBytes(bodySize)})
      </Button>
    )
  }

  if (loading) {
    return <div className="text-xs text-muted-foreground italic">Loading...</div>
  }

  if (!body) {
    return (
      <div className="text-xs font-mono bg-muted/30 rounded p-2 text-muted-foreground italic">
        Empty body
      </div>
    )
  }

  // For image content, render the image
  if (category === 'image') {
    // Convert base64 body to data URL if needed
    let src = body
    if (!body.startsWith('data:')) {
      const ct = contentType || 'image/png'
      src = `data:${ct};base64,${body}`
    }
    return (
      <div className="flex flex-col gap-2">
        <img
          src={src}
          alt="Response"
          className="max-w-full max-h-64 object-contain border border-border rounded"
        />
        <pre className="text-xs font-mono bg-muted/30 rounded p-2 whitespace-pre-wrap break-all text-foreground/80 max-h-32 overflow-auto">
          {bodySize !== null ? `${formatBytes(bodySize)}` : ''}
        </pre>
      </div>
    )
  }

  // For HTML content, show toggle between preview and source
  if (category === 'html') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-6"
            onClick={() => setViewMode('preview')}
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </Button>
          <Button
            variant={viewMode === 'source' ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-6"
            onClick={() => setViewMode('source')}
          >
            <Code className="w-3 h-3 mr-1" />
            Source
          </Button>
          {bodySize !== null && (
            <span className="text-xs text-muted-foreground ml-2">{formatBytes(bodySize)}</span>
          )}
        </div>
        {viewMode === 'preview' ? (
          <iframe
            srcDoc={body}
            className="w-full h-64 border border-border rounded bg-white"
            sandbox="allow-scripts allow-same-origin"
            title="HTML Preview"
          />
        ) : (
          <pre className="text-xs font-mono bg-muted/30 rounded p-2 whitespace-pre-wrap break-all text-foreground/80 max-h-64 overflow-auto">
            {body}
          </pre>
        )}
      </div>
    )
  }

  // Format JSON, XML, and JavaScript with auto-detection
  let displayBody = body
  let language = 'text'

  // First try content-type specific formatting
  const formDataFormatted = tryFormatFormData(body, contentType)
  if (formDataFormatted) {
    displayBody = formDataFormatted
    language = 'form'
  } else if (category === 'json') {
    try {
      displayBody = JSON.stringify(JSON.parse(body), null, 2)
      language = 'json'
    } catch {
      // Invalid JSON, try auto-detection
      const detected = tryDetectAndFormat(body)
      displayBody = detected.formatted
      language = detected.language
    }
  } else if (category === 'xml') {
    try {
      displayBody = formatXml(body)
      language = 'xml'
    } catch {
      // Invalid XML, show as-is
    }
  } else if (category === 'javascript') {
    language = 'javascript'
  } else {
    // Try auto-detection for unknown content types
    const detected = tryDetectAndFormat(body)
    if (detected.language !== 'text') {
      displayBody = detected.formatted
      language = detected.language
    }
  }

  // Syntax highlighting colors
  const getSyntaxHighlightClass = (lang: string): string => {
    switch (lang) {
      case 'json':
      case 'xml':
      case 'javascript':
      case 'form':
        return 'bg-slate-950 border border-slate-800'
      default:
        return 'bg-muted/30'
    }
  }

  // Check if we should use syntax highlighting
  const shouldHighlight = ['json', 'form', 'xml'].includes(language)

  return (
    <div className="flex flex-col gap-1">
      {bodySize !== null && (
        <span className="text-xs text-muted-foreground">{formatBytes(bodySize)}</span>
      )}
      <pre className={cn(
        "text-xs font-mono rounded p-2 whitespace-pre-wrap break-all max-h-64 overflow-auto",
        getSyntaxHighlightClass(language),
        shouldHighlight ? 'text-slate-300' : 'text-foreground/80'
      )}>
        {shouldHighlight ? (
          <SyntaxHighlighted text={displayBody} language={language} />
        ) : (
          displayBody
        )}
      </pre>
    </div>
  )
}

function headersToText(headers: Record<string, string>): string {
  return Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n')
}

function buildRawRequest(req: HttpRequest): string {
  const lines: string[] = [
    `${req.method} ${req.path} HTTP/1.1`,
    `Host: ${req.host}`,
    ...Object.entries(req.requestHeaders).map(([k, v]) => `${k}: ${v}`),
  ]
  return lines.join('\n')
}

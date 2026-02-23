import { useState, useEffect, useCallback } from 'react'
import type { HttpRequest } from '@shared/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { X, Copy, Terminal } from 'lucide-react'
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
                loading={loadingReqBody}
                onLoad={loadRequestBody}
                contentType={request.contentType}
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
  loading: boolean
  onLoad: () => void
  contentType: string | null | undefined
}

function BodyViewer({ body, loading, onLoad, contentType }: BodyViewerProps) {
  const isJsonType = contentType?.includes('json')

  if (body === null && !loading) {
    return (
      <Button variant="outline" size="sm" className="text-xs h-7" onClick={onLoad}>
        Load body
      </Button>
    )
  }

  if (loading) {
    return <div className="text-xs text-muted-foreground italic">Loading...</div>
  }

  let displayBody = body ?? ''
  if (isJsonType || (body && body.trimStart().startsWith('{'))) {
    try { displayBody = JSON.stringify(JSON.parse(body!), null, 2) } catch {}
  }

  return (
    <pre className="text-xs font-mono bg-muted/30 rounded p-2 whitespace-pre-wrap break-all text-foreground/80 max-h-64 overflow-auto">
      {displayBody || <span className="text-muted-foreground italic">Empty body</span>}
    </pre>
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

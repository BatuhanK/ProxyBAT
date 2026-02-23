"""
ProxyBat mitmproxy addon.

Emits newline-delimited JSON to stdout for each captured HTTP flow.
The Node.js ProxyManager reads these lines and stores/forwards them.

Also reads commands from stdin (newline-delimited JSON):
  {"cmd": "set_scripts",   "scripts": [...]}
  {"cmd": "set_ssl_rules", "rules": [{"pattern": "*.example.com", "enabled": true}]}

User scripts are Python snippets executed via exec(). The `flow` object is
available as a mitmproxy HTTPFlow. Scripts can modify flow.request or
flow.response directly. Set `flow.kill()` to drop the connection.

The following helper functions are automatically available in script scope:

  llm_complete(prompt, system=None, model=None)
    → str  — calls the local LLM API (port 47821) and returns the text response.

  llm_structured(prompt, schema, system=None, model=None)
    → dict — calls the LLM with a JSON Schema and returns a parsed dict.

  llm_complete_async(prompt, callback, system=None, model=None)
    → None — fires the LLM call in a background thread (non-blocking).
             callback(text: str) is called when the result is ready.

  bs4_parse(html, selector=None)
    → dict — parse HTML with BeautifulSoup4 and return a structured result.
             If selector is given, returns matching elements' text.
             Returns {"title": ..., "text": ..., "elements": [...]} by default.

  inject_script(flow, js_code)
    → None — inject a <script> tag into an HTML response body. Call in
             response phase. js_code is a JavaScript string.
             The injected script can call the LLM API directly via fetch():
               fetch("http://127.0.0.1:47821/v1/complete", {...})

Example request script (append xxx to Authorization header):
    auth = flow.request.headers.get("authorization", "")
    if auth:
        flow.request.headers["authorization"] = auth + "xxx"

Example LLM script:
    import json
    body = flow.response.text[:2000] if flow.response else ""
    analysis = llm_complete(f"Analyze this HTTP response for security issues:\\n{body}")
    ctx.log.info(f"[LLM] {analysis}")

Message types emitted to stdout:
  {"type": "request",          "id": ..., ...}
  {"type": "response",         "id": ..., ...}
  {"type": "ready"}
  {"type": "error",            "id": ..., "message": ...}
  {"type": "connection_error", "host": ..., "reason": ..., "error_type": ...}
  {"type": "script_log",       "script": ..., "level": ..., "message": ...}
  {"type": "script_error",     "script": ..., "error": ...}
"""

from __future__ import annotations

import base64
import fnmatch
import json
import sys
import threading
import time
import traceback
from typing import Optional, Callable

from mitmproxy import http
from mitmproxy import ctx

# ─── LLM API helpers ──────────────────────────────────────────────────────────

LLM_API_BASE = "http://127.0.0.1:47821"


def _llm_post(endpoint: str, payload: dict) -> dict:
    """Send a POST request to the local LLM API server and return parsed JSON."""
    import urllib.request
    import urllib.error

    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{LLM_API_BASE}{endpoint}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LLM API HTTP {e.code}: {error_body}") from e
    except Exception as e:
        raise RuntimeError(f"LLM API request failed: {e}") from e


def llm_complete(prompt: str, system: Optional[str] = None, model: Optional[str] = None) -> str:
    """
    Call the ProxyBat LLM API and return the text response (blocking).

    Args:
        prompt: The user prompt to send to the LLM.
        system: Optional system prompt override.
        model:  Optional model override (default: k2p5).

    Returns:
        The LLM's text response as a string.

    Example:
        analysis = llm_complete(f"Analyze this response:\\n{flow.response.text[:2000]}")
        ctx.log.info(f"[LLM] {analysis}")
    """
    payload: dict = {"prompt": prompt}
    if system:
        payload["system"] = system
    if model:
        payload["model"] = model
    result = _llm_post("/v1/complete", payload)
    return result.get("text", "")


def llm_structured(
    prompt: str,
    schema: dict,
    system: Optional[str] = None,
    model: Optional[str] = None,
) -> dict:
    """
    Call the ProxyBat LLM API and return a dict matching the given JSON Schema (blocking).

    Args:
        prompt: The user prompt to send to the LLM.
        schema: A JSON Schema dict describing the expected output shape.
        system: Optional system prompt override.
        model:  Optional model override (default: k2p5).

    Returns:
        A dict of the structured result (already parsed — no json.loads needed).

    Example:
        import json
        result = llm_structured(
            f"Extract auth info from headers: {dict(flow.request.headers)}",
            schema={
                "type": "object",
                "properties": {
                    "has_auth":     {"type": "boolean"},
                    "auth_type":    {"type": "string"},
                    "token_preview": {"type": "string"}
                },
                "required": ["has_auth", "auth_type"]
            }
        )
        ctx.log.info(f"[LLM] Auth type: {result['auth_type']}")
    """
    payload: dict = {"prompt": prompt, "schema": schema}
    if system:
        payload["system"] = system
    if model:
        payload["model"] = model
    result = _llm_post("/v1/complete/structured", payload)
    return result.get("result", {})


def llm_complete_async(
    prompt: str,
    callback: Callable[[str], None],
    system: Optional[str] = None,
    model: Optional[str] = None,
) -> None:
    """
    Call the ProxyBat LLM API in a background thread (non-blocking).
    Returns immediately; callback(text) is called when the LLM responds.

    Use this when you don't want to stall the proxied request/response while
    waiting for the LLM (e.g. for logging/analysis side-effects).

    Args:
        prompt:   The user prompt.
        callback: Called with the response text string when ready.
        system:   Optional system prompt override.
        model:    Optional model override.

    Example:
        def on_result(text):
            ctx.log.info(f"[LLM async] {text}")

        llm_complete_async(
            f"Summarise: {flow.response.text[:500]}",
            callback=on_result,
        )
        # execution continues immediately, LLM runs in background
    """
    def _run():
        try:
            text = llm_complete(prompt, system=system, model=model)
            callback(text)
        except Exception as e:
            callback(f"[llm_complete_async error] {e}")

    t = threading.Thread(target=_run, daemon=True)
    t.start()


# ─── BeautifulSoup4 helper ────────────────────────────────────────────────────

def bs4_parse(html: str, selector: Optional[str] = None) -> dict:
    """
    Parse an HTML string with BeautifulSoup4 and return a structured dict.

    If `selector` is given (CSS selector string), returns a list of matching
    elements' text content under the key "elements". Otherwise returns the
    page title and full visible text.

    This is ideal for extracting only the meaningful text from a page before
    passing it to llm_complete/llm_structured — avoids dumping raw HTML to
    the LLM and saves tokens.

    Args:
        html:     Raw HTML string (e.g. flow.response.text).
        selector: Optional CSS selector, e.g. "h1", "article", ".price", "#main".

    Returns:
        dict with keys:
          - "title":    str  — <title> tag text (always present)
          - "text":     str  — full visible text (when no selector)
          - "elements": list[str] — matched element texts (when selector given)
          - "error":    str  — set if BeautifulSoup4 is not installed

    Example — extract title and body text:
        if flow.response and "text/html" in flow.response.headers.get("content-type", ""):
            parsed = bs4_parse(flow.response.text)
            summary = llm_complete(f"Summarise this page:\\n{parsed['text'][:3000]}")
            ctx.log.info(f"[LLM] {parsed['title']}: {summary}")

    Example — extract specific elements:
        parsed = bs4_parse(flow.response.text, selector="h1, h2, .price")
        result = llm_structured(
            f"Extract product info from these headings: {parsed['elements']}",
            schema={
                "type": "object",
                "properties": {
                    "product_name": {"type": "string"},
                    "price":        {"type": "string"}
                },
                "required": ["product_name"]
            }
        )
    """
    try:
        from bs4 import BeautifulSoup  # type: ignore
    except ImportError:
        return {
            "title": "",
            "text": "",
            "elements": [],
            "error": "BeautifulSoup4 not installed. Run: pip install beautifulsoup4",
        }

    try:
        soup = BeautifulSoup(html, "html.parser")

        # Remove script/style noise
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()

        title = soup.title.get_text(strip=True) if soup.title else ""

        if selector:
            elements = [el.get_text(separator=" ", strip=True) for el in soup.select(selector)]
            return {"title": title, "elements": elements, "text": ""}
        else:
            text = soup.get_text(separator="\n", strip=True)
            return {"title": title, "text": text, "elements": []}
    except Exception as e:
        return {"title": "", "text": "", "elements": [], "error": str(e)}


# ─── JS injection helper ──────────────────────────────────────────────────────

def inject_script(flow: http.HTTPFlow, js_code: str) -> None:
    """
    Inject a <script> tag containing js_code into an HTML response (response phase only).

    The script is inserted just before </body> (or at the end of the document).
    The injected JS runs in the page's browser context and can make fetch() calls
    to the LLM API at http://127.0.0.1:47821 — CORS is enabled for all origins.

    Args:
        flow:    The mitmproxy HTTPFlow (must be in response phase with HTML body).
        js_code: JavaScript source code string to inject.

    Example — inject a script that calls the LLM API for each page load:
        if flow.response and "text/html" in flow.response.headers.get("content-type", ""):
            inject_script(flow, '''
                fetch("http://127.0.0.1:47821/v1/complete", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        prompt: "Page title: " + document.title + ". What does this site do?",
                    })
                })
                .then(r => r.json())
                .then(d => console.log("[ProxyBat LLM]", d.text))
                .catch(e => console.error("[ProxyBat LLM error]", e));
            ''')
    """
    if flow.response is None:
        return
    try:
        html = flow.response.text
        tag = f"<script>{js_code}</script>"
        if "</body>" in html:
            html = html.replace("</body>", f"{tag}</body>", 1)
        else:
            html = html + tag
        flow.response.set_text(html)
        # Remove Content-Security-Policy headers that would block the injected script
        flow.response.headers.pop("content-security-policy", None)
        flow.response.headers.pop("content-security-policy-report-only", None)
    except Exception as e:
        sys.stderr.write(f"[addon] inject_script error: {e}\n")
        sys.stderr.flush()


# ─── Shared helpers ───────────────────────────────────────────────────────────

def _safe_headers(headers) -> dict:
    result = {}
    for k, v in headers.items():
        try:
            result[k.lower()] = v
        except Exception:
            pass
    return result


def _emit(obj: dict) -> None:
    try:
        line = json.dumps(obj, separators=(",", ":"))
        sys.stdout.write(line + "\n")
        sys.stdout.flush()
    except Exception as e:
        sys.stderr.write(f"[addon] emit error: {e}\n")
        sys.stderr.flush()


def _encode_body(body: Optional[bytes]) -> Optional[str]:
    if not body:
        return None
    return base64.b64encode(body).decode("ascii")


def _match_pattern(host: str, pattern: str) -> bool:
    """Match a host against a glob pattern (e.g. '*.example.com')."""
    return fnmatch.fnmatch(host, pattern)


# ─── Script log / ctx proxy ───────────────────────────────────────────────────

class _ScriptLog:
    """Forwards ctx.log.* calls from a script to both mitmproxy and the UI."""
    def __init__(self, script_name: str):
        self._name = script_name

    def _send(self, level: str, msg: str) -> None:
        getattr(ctx.log, level)(msg)
        _emit({"type": "script_log", "script": self._name, "level": level, "message": msg})

    def debug(self, msg: str) -> None:   self._send("debug",   str(msg))
    def info(self, msg: str) -> None:    self._send("info",    str(msg))
    def warn(self, msg: str) -> None:    self._send("warn",    str(msg))
    def warning(self, msg: str) -> None: self._send("warn",    str(msg))
    def error(self, msg: str) -> None:   self._send("error",   str(msg))
    def alert(self, msg: str) -> None:   self._send("alert",   str(msg))


class _ScriptCtxProxy:
    """Thin ctx wrapper passed into exec'd scripts — intercepts ctx.log.*."""
    def __init__(self, script_name: str):
        self.log = _ScriptLog(script_name)


# ─── Main addon ───────────────────────────────────────────────────────────────

class ProxyBatAddon:
    def __init__(self):
        self._start_times: dict[str, float] = {}
        # List of dicts: {id, name, code, phase, enabled}
        self._scripts: list[dict] = []
        self._scripts_lock = threading.Lock()
        # List of dicts: {pattern, enabled}
        # When non-empty, ONLY matching hosts are SSL-intercepted.
        # When empty, ALL hosts are intercepted (default mitmproxy behaviour).
        self._ssl_rules: list[dict] = []
        self._ssl_rules_lock = threading.Lock()
        # Start stdin reader thread
        self._stdin_thread = threading.Thread(target=self._read_stdin, daemon=True)
        self._stdin_thread.start()

    # ─── Stdin command reader ───────────────────────────────────────────────

    def _read_stdin(self) -> None:
        """Reads newline-delimited JSON commands from stdin sent by ProxyManager."""
        for raw_line in sys.stdin:
            line = raw_line.strip()
            if not line:
                continue
            try:
                cmd = json.loads(line)
                self._handle_command(cmd)
            except Exception as e:
                sys.stderr.write(f"[addon] stdin parse error: {e}\n")
                sys.stderr.flush()

    def _handle_command(self, cmd: dict) -> None:
        if cmd.get("cmd") == "set_scripts":
            scripts = cmd.get("scripts", [])
            with self._scripts_lock:
                self._scripts = scripts
            sys.stderr.write(f"[addon] loaded {len(scripts)} script(s)\n")
            sys.stderr.flush()

        elif cmd.get("cmd") == "set_ssl_rules":
            rules = cmd.get("rules", [])
            with self._ssl_rules_lock:
                self._ssl_rules = [r for r in rules if r.get("enabled", True)]
            sys.stderr.write(f"[addon] loaded {len(self._ssl_rules)} SSL rule(s)\n")
            sys.stderr.flush()

    # ─── SSL rule helpers ──────────────────────────────────────────────────

    def _should_intercept_ssl(self, host: str) -> bool:
        """
        Returns True if this host should be SSL-intercepted.

        Logic:
          - If no enabled rules → intercept everything (default behaviour).
          - If rules exist → only intercept if host matches at least one rule.
        """
        with self._ssl_rules_lock:
            rules = list(self._ssl_rules)

        if not rules:
            return True  # no rules = intercept all

        for rule in rules:
            pattern = rule.get("pattern", "")
            if not pattern:
                continue
            if _match_pattern(host, pattern):
                return True

        return False  # rules exist but none matched → don't intercept

    # ─── Script execution ──────────────────────────────────────────────────

    def _run_scripts(self, phase: str, flow: http.HTTPFlow) -> None:
        """Execute all enabled scripts matching phase in order."""
        with self._scripts_lock:
            scripts = list(self._scripts)

        for script in scripts:
            if not script.get("enabled", True):
                continue
            script_phase = script.get("phase", "both")
            if script_phase != "both" and script_phase != phase:
                continue

            code = script.get("code", "")
            name = script.get("name", "unnamed")
            if not code.strip():
                continue

            try:
                script_ctx = _ScriptCtxProxy(name)
                exec(
                    compile(code, f"<script:{name}>", "exec"),
                    {
                        "flow": flow,
                        "phase": phase,
                        "ctx": script_ctx,
                        # LLM helpers
                        "llm_complete": llm_complete,
                        "llm_structured": llm_structured,
                        "llm_complete_async": llm_complete_async,
                        # HTML parsing
                        "bs4_parse": bs4_parse,
                        # JS injection
                        "inject_script": inject_script,
                    },
                )
            except Exception:
                tb = traceback.format_exc()
                sys.stderr.write(f"[addon] script '{name}' error:\n{tb}\n")
                sys.stderr.flush()
                _emit({"type": "script_error", "script": name, "error": tb})

    # ─── mitmproxy hooks ───────────────────────────────────────────────────

    def running(self):
        """Called when mitmproxy is fully started."""
        _emit({"type": "ready"})

    def tls_clienthello(self, data) -> None:
        """
        Called when mitmproxy receives a TLS ClientHello from the client.
        If SSL rules are configured and the server host doesn't match any rule,
        set data.ignore_connection = True so mitmproxy forwards the encrypted
        traffic as a raw TCP tunnel without decrypting it (no error logs).

        Host resolution order:
          1. SNI from the ClientHello (most reliable — sent by the client)
          2. server.address from the context (set by the CONNECT tunnel)
        If neither is available, allow interception by default.
        """
        host: str | None = None

        # Prefer SNI — it's present in the ClientHello itself and is always
        # the actual target hostname, even before server.address is resolved.
        try:
            host = data.client_hello.sni  # str | None
        except AttributeError:
            pass

        # Fallback: CONNECT tunnel target (IP or hostname)
        if not host:
            try:
                host = data.context.server.address[0]
            except (AttributeError, TypeError, IndexError):
                pass

        if not host:
            return  # can't determine host — allow interception by default

        if not self._should_intercept_ssl(host):
            data.ignore_connection = True

    def request(self, flow: http.HTTPFlow) -> None:
        # Skip OPTIONS requests (CORS preflight)
        if flow.request.method == "OPTIONS":
            return

        self._start_times[flow.id] = time.time()

        # Run request-phase scripts — they can modify flow.request before it's forwarded
        self._run_scripts("request", flow)

        req = flow.request
        try:
            body = _encode_body(req.content)
        except Exception:
            body = None

        _emit({
            "type": "request",
            "id": flow.id,
            "method": req.method,
            "url": req.pretty_url,
            "host": req.pretty_host,
            "path": req.path,
            "request_headers": _safe_headers(req.headers),
            "request_body": body,
            "ssl": flow.request.scheme == "https",
            "timestamp": self._start_times[flow.id],
        })

    def response(self, flow: http.HTTPFlow) -> None:
        if flow.response is None:
            return

        # Run response-phase scripts — they can modify flow.response before it's sent back
        self._run_scripts("response", flow)

        start = self._start_times.pop(flow.id, time.time())
        duration_ms = int((time.time() - start) * 1000)

        res = flow.response
        try:
            body = _encode_body(res.content)
        except Exception:
            body = None

        content_type = res.headers.get("content-type", None)

        _emit({
            "type": "response",
            "id": flow.id,
            "status": res.status_code,
            "response_headers": _safe_headers(res.headers),
            "response_body": body,
            "content_type": content_type,
            "duration_ms": duration_ms,
        })

    def error(self, flow: http.HTTPFlow) -> None:
        self._start_times.pop(flow.id, None)
        err_msg = str(flow.error) if flow.error else "unknown error"

        # Classify connection errors so the UI can show actionable suggestions
        error_type = _classify_error(err_msg)
        host = ""
        try:
            host = flow.request.pretty_host
        except Exception:
            pass

        _emit({
            "type": "error",
            "id": flow.id,
            "message": err_msg,
        })

        # Emit a separate connection_error event for errors that never made it
        # into the request list (e.g. SSL pinning, HTTP/2 stream resets).
        # The UI can show these to the user with suggestions.
        if error_type and host:
            _emit({
                "type": "connection_error",
                "host": host,
                "reason": err_msg,
                "error_type": error_type,
            })


def _classify_error(message: str) -> Optional[str]:
    """
    Classify a mitmproxy error message into a UI-actionable error type.
    Returns None for benign/uninteresting errors.
    """
    msg = message.lower()
    # HTTP/2 stream resets (CANCEL, NO_ERROR) happen routinely when browsers
    # close connections mid-flight or when we're passing through ignored TLS
    # connections.  These are not actionable — suppress them.
    if "stream reset" in msg:
        return None
    if "ssl" in msg or "tls" in msg or "certificate" in msg:
        return "ssl_error"
    if "connection refused" in msg:
        return "connection_refused"
    if "timeout" in msg:
        return "timeout"
    return None


addons = [ProxyBatAddon()]

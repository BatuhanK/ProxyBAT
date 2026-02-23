import type {
  IpcRequestClear,
  IpcRequestDelete,
  IpcRequestDeleteFiltered,
  IpcRequestGet,
  IpcRequestGetBody,
  IpcRequestList,
  IpcRequestResend,
  IpcRequestResendResult,
} from "@shared/ipc-contracts";
import { IPC } from "@shared/ipc-contracts";
import { execFile } from "child_process";
import { ipcMain } from "electron";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { BodyStore } from "../storage/BodyStore";
import { RequestStore } from "../storage/RequestStore";

export function registerRequestHandlers(): void {
  ipcMain.handle(IPC.REQUEST.LIST, (_event, params: IpcRequestList) => {
    return RequestStore.getInstance().list(params);
  });

  ipcMain.handle(IPC.REQUEST.GET, (_event, params: IpcRequestGet) => {
    return { request: RequestStore.getInstance().getById(params.requestId) };
  });

  ipcMain.handle(
    IPC.REQUEST.GET_BODY,
    async (_event, params: IpcRequestGetBody) => {
      try {
        const { data, totalBytes } = await BodyStore.getInstance().get(
          params.key,
          params.offset,
          params.limit,
        );

        // Try to detect if content is text
        let body: string;
        let encoding = "utf8";

        try {
          body = data.toString("utf8");
        } catch {
          body = data.toString("base64");
          encoding = "base64";
        }

        return { body, totalBytes, encoding };
      } catch {
        return { body: "", totalBytes: 0, encoding: "utf8" };
      }
    },
  );

  ipcMain.handle(IPC.REQUEST.DELETE, (_event, params: IpcRequestDelete) => {
    const success = RequestStore.getInstance().delete(params.requestId);
    return { success };
  });

  ipcMain.handle(IPC.REQUEST.CLEAR, (_event, params: IpcRequestClear) => {
    const deleted = RequestStore.getInstance().clearSession(params.sessionId);
    return { success: true, deleted };
  });

  ipcMain.handle(
    IPC.REQUEST.DELETE_FILTERED,
    (_event, params: IpcRequestDeleteFiltered) => {
      const deleted = RequestStore.getInstance().deleteFiltered(params);
      return { success: true, deleted };
    },
  );

  ipcMain.handle(
    IPC.REQUEST.RESEND,
    async (
      _event,
      params: IpcRequestResend,
    ): Promise<IpcRequestResendResult> => {
      const start = Date.now();
      const curlBin =
        params.curlBinary && params.curlBinary.trim()
          ? params.curlBinary.trim()
          : "curl";

      // Write body to a temp file to avoid shell quoting issues
      let bodyFile: string | null = null;
      if (params.body) {
        bodyFile = path.join(os.tmpdir(), `ProxyBat-resend-${Date.now()}.tmp`);
        fs.writeFileSync(bodyFile, params.body, "utf8");
      }

      try {
        const args: string[] = [
          "-si", // silent + include response headers
          "-k", // skip TLS verification (proxy-intercepted traffic may use self-signed certs)
          "-X",
          params.method,
        ];

        // Headers
        for (const [name, value] of Object.entries(params.headers)) {
          if (name.startsWith(":")) continue; // HTTP/2 pseudo-headers
          if (name.toLowerCase() === "content-length") continue; // curl sets this automatically
          if (name.toLowerCase() === "transfer-encoding") continue;
          args.push("-H", `${name}: ${value}`);
        }

        // Body via temp file (avoids shell quoting entirely)
        if (bodyFile) {
          args.push("--data-binary", `@${bodyFile}`);
        }

        args.push(params.url);

        const raw = await new Promise<string>((resolve, reject) => {
          execFile(
            curlBin,
            args,
            { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
            (err, stdout) => {
              if (err && !stdout) {
                reject(err);
              } else {
                // curl -si exits non-zero on HTTP errors but still gives output — use stdout
                resolve(stdout || "");
              }
            },
          );
        });

        // Parse curl -i output: status line + headers, blank line, then body
        const headerBodySplit = raw.indexOf("\r\n\r\n");
        const headerBodySplitLF = raw.indexOf("\n\n");
        const splitIdx =
          headerBodySplit !== -1
            ? headerBodySplit
            : headerBodySplitLF !== -1
              ? headerBodySplitLF
              : -1;

        let headerSection = raw;
        let body = "";
        if (splitIdx !== -1) {
          const sep = headerBodySplit !== -1 ? "\r\n\r\n" : "\n\n";
          headerSection = raw.slice(0, splitIdx);
          body = raw.slice(splitIdx + sep.length);
        }

        const headerLines = headerSection.split(/\r?\n/);
        const statusLine = headerLines[0] ?? "";
        // e.g. "HTTP/1.1 200 OK"  or "HTTP/2 200"
        const statusMatch = statusLine.match(
          /^HTTP\/[\d.]+ (\d+)(?:\s+(.*))?$/,
        );
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0;
        const statusText = statusMatch ? (statusMatch[2] ?? "") : "";

        const resHeaders: Record<string, string> = {};
        for (const line of headerLines.slice(1)) {
          const colon = line.indexOf(":");
          if (colon === -1) continue;
          const k = line.slice(0, colon).trim().toLowerCase();
          const v = line.slice(colon + 1).trim();
          resHeaders[k] = v;
        }

        return {
          statusCode,
          statusText,
          headers: resHeaders,
          body,
          durationMs: Date.now() - start,
        };
      } catch (err) {
        return {
          statusCode: 0,
          statusText: "",
          headers: {},
          body: "",
          durationMs: Date.now() - start,
          error: String(err),
        };
      } finally {
        if (bodyFile) {
          try {
            fs.unlinkSync(bodyFile);
          } catch {
            /* ignore */
          }
        }
      }
    },
  );
}

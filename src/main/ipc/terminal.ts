import type {
  IpcTerminalClose,
  IpcTerminalCreate,
  IpcTerminalResize,
  IpcTerminalWrite,
} from "@shared/ipc-contracts";
import { IPC, PUSH } from "@shared/ipc-contracts";
import { BrowserWindow, ipcMain } from "electron";
import { chmodSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { AgentManager } from "../agent/AgentManager";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pty = require("node-pty") as typeof import("node-pty");

interface PtySession {
  pty: import("node-pty").IPty;
  sessionId: string;
}

const ptyMap = new Map<string, PtySession>();
let terminalCounter = 0;

function fixSpawnHelperPermissions(): void {
  if (process.platform === "win32") return;
  try {
    const pkgJson = require.resolve("node-pty/package.json");
    const prebuildsDir = resolve(pkgJson, "../prebuilds");
    for (const plat of readdirSync(prebuildsDir)) {
      const helper = join(prebuildsDir, plat, "spawn-helper");
      try {
        if (statSync(helper).mode & 0o111) continue; // already executable
        chmodSync(helper, 0o755);
      } catch {
        /* skip missing files */
      }
    }
  } catch {
    /* node-pty not found or prebuilds absent */
  }
}

function push(channel: string, data: unknown): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) win.webContents.send(channel, data);
  }
}

export function registerTerminalHandlers(): void {
  fixSpawnHelperPermissions();

  ipcMain.handle(
    IPC.TERMINAL.CREATE,
    async (_event, params: IpcTerminalCreate) => {
      try {
        const manager = AgentManager.getInstance();
        // Ensure session in memory so we can get workspacePath
        await manager.startSession(params.sessionId);
        const workspacePath = manager.getWorkspacePath(params.sessionId);
        if (!workspacePath)
          return { terminalId: "", error: "Session not found" };

        // Ensure workspace directory exists before spawning (posix_spawnp fails if cwd missing)
        mkdirSync(workspacePath, { recursive: true });

        const terminalId = `term-${++terminalCounter}`;
        const isWin = process.platform === "win32";
        const shell = isWin
          ? "powershell.exe"
          : (process.env.SHELL ?? "/bin/zsh");
        const args = isWin ? [] : ["-l"];

        // Build a complete env so the user's shell (zsh + oh-my-zsh) initialises properly
        const env: Record<string, string> = {
          ...(process.env as Record<string, string>),
          HOME: process.env.HOME ?? require("os").homedir(),
          SHELL: shell,
          TERM: "xterm-256color",
          TERM_PROGRAM: "ProxyBat",
          COLORTERM: "truecolor",
          LANG: process.env.LANG ?? "en_US.UTF-8",
        };

        const ptyProcess = pty.spawn(shell, args, {
          name: "xterm-256color",
          cols: 80,
          rows: 24,
          cwd: workspacePath,
          env,
        });

        ptyProcess.onData((data) => {
          push(PUSH.TERMINAL_DATA, { terminalId, data });
        });

        ptyProcess.onExit(() => {
          ptyMap.delete(terminalId);
          push(PUSH.TERMINAL_DATA, {
            terminalId,
            data: "\r\n[Process exited]\r\n",
          });
        });

        ptyMap.set(terminalId, {
          pty: ptyProcess,
          sessionId: params.sessionId,
        });
        return { terminalId };
      } catch (err) {
        return { terminalId: "", error: String(err) };
      }
    },
  );

  ipcMain.handle(IPC.TERMINAL.WRITE, (_event, params: IpcTerminalWrite) => {
    const session = ptyMap.get(params.terminalId);
    if (!session) return { success: false };
    try {
      session.pty.write(params.data);
      return { success: true };
    } catch {
      return { success: false };
    }
  });

  ipcMain.handle(IPC.TERMINAL.RESIZE, (_event, params: IpcTerminalResize) => {
    const session = ptyMap.get(params.terminalId);
    if (!session) return { success: false };
    try {
      session.pty.resize(params.cols, params.rows);
      return { success: true };
    } catch {
      return { success: false };
    }
  });

  ipcMain.handle(IPC.TERMINAL.CLOSE, (_event, params: IpcTerminalClose) => {
    const session = ptyMap.get(params.terminalId);
    if (!session) return { success: false };
    try {
      session.pty.kill();
      ptyMap.delete(params.terminalId);
      return { success: true };
    } catch {
      return { success: false };
    }
  });
}

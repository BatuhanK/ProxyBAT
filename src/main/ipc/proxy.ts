import type { IpcProxyStart, IpcProxyStop } from "@shared/ipc-contracts";
import { IPC } from "@shared/ipc-contracts";
import type { ProxySession } from "@shared/types";
import { BrowserWindow, dialog, ipcMain } from "electron";
import { ProxyManager } from "../proxy/ProxyManager";
import { SessionStore } from "../storage/SessionStore";
import {
  isSystemProxySet,
  setSystemProxy,
  unsetSystemProxy,
} from "./systemProxy";

export function registerProxyHandlers(): void {
  ipcMain.handle(IPC.PROXY.START, async (_event, params: IpcProxyStart) => {
    try {
      const manager = ProxyManager.getInstance();

      // Use existing session if provided, otherwise create new
      const sessionStore = SessionStore.getInstance()
      let session: ProxySession
      if (params?.sessionId) {
        const existing = sessionStore.reactivate(params.sessionId)
        if (!existing) {
          return { success: false, error: 'Session not found' }
        }
        session = existing
      } else {
        session = sessionStore.create(params?.sessionName)
      };

      if (params?.settings) {
        const { SettingsStore } = await import("../storage/SettingsStore");
        SettingsStore.getInstance().updateProxySettings(params.settings);
      }

      const { port } = await manager.start(session.id);

      // Ask user if they want to set the system proxy
      const win =
        BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
      if (win && !win.isDestroyed()) {
        const { response } = await dialog.showMessageBox(win, {
          type: "question",
          buttons: ["Set System Proxy", "Skip"],
          defaultId: 0,
          cancelId: 1,
          title: "System Proxy",
          message: "Set system proxy to ProxyBat?",
          detail: `This will route all system HTTP/HTTPS traffic through 127.0.0.1:${port}.`,
        });
        if (response === 0) {
          setSystemProxy("127.0.0.1", port);
        }
      }

      return { success: true, port, sessionId: session.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(IPC.PROXY.STOP, async (_event, params: IpcProxyStop) => {
    try {
      const manager = ProxyManager.getInstance();
      const sessionId = params?.sessionId ?? manager.getActiveSessionId();

      // Silently unset system proxy if it is currently set
      if (isSystemProxySet()) {
        unsetSystemProxy();
      }

      await manager.stop();

      if (sessionId) {
        SessionStore.getInstance().stop(sessionId);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(IPC.PROXY.GET_STATUS, () => {
    const manager = ProxyManager.getInstance();
    return {
      status: manager.getStatus(),
      port: manager.getActivePort(),
      activeSessionId: manager.getActiveSessionId(),
    };
  });
}

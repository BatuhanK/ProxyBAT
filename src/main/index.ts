import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, nativeImage, shell } from "electron";
import { join } from "path";
import { registerAgentHandlers } from "./ipc/agent";
import { registerCertificateHandlers } from "./ipc/certificate";
import { registerDoctorHandlers } from "./ipc/doctor";
import { registerIgnoreRuleHandlers } from "./ipc/ignoreRule";
import { registerProxyHandlers } from "./ipc/proxy";
import { registerRequestHandlers } from "./ipc/request";
import { registerScriptHandlers } from "./ipc/script";
import { registerSessionHandlers } from "./ipc/session";
import { registerSettingsHandlers } from "./ipc/settings";
import { registerShellHandlers } from "./ipc/shell";
import { registerSslRuleHandlers } from "./ipc/sslRule";
import { registerSystemProxyHandlers } from "./ipc/systemProxy";
import { registerTerminalHandlers } from "./ipc/terminal";
import { initAutoUpdater } from "./updater";
import { LlmApiServer } from "./llm-api/LlmApiServer";
import { BodyStore } from "./storage/BodyStore";
import { Database } from "./storage/Database";

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  // Resolve icon path — works both in dev and packaged
  const iconPath = join(__dirname, "../../resources/icons/icon.icns");
  let icon: Electron.NativeImage | undefined;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) icon = undefined;
  } catch {
    icon = undefined;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hidden" : "default",
    backgroundColor: "#09090b",
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow!.show();
    if (process.platform === "darwin") {
      mainWindow!.setWindowButtonVisibility(false);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return mainWindow;
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId("com.batuhank.ProxyBat");
  app.setName("ProxyBat");

  // Force dock/taskbar icon (especially important in dev mode)
  const iconPath = join(__dirname, "../../resources/icons/icon.png");

  try {
    const dockIcon = nativeImage.createFromPath(iconPath);

    if (dockIcon.isEmpty()) {
      console.error(
        "HATA: İkon dosyası boş döndü. Ya yol yanlış ya da format desteklenmiyor.",
      );
    } else {
      if (process.platform === "darwin") {
        app.dock.setIcon(dockIcon);
      }
    }
  } catch (error) {
    console.error("İkon yükleme hatası:", error);
  }

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Initialize database
  await Database.getInstance().initialize();
  await BodyStore.getInstance().initialize();

  // Register all IPC handlers
  registerProxyHandlers();
  registerSessionHandlers();
  registerRequestHandlers();
  registerSslRuleHandlers();
  registerCertificateHandlers();
  registerDoctorHandlers();
  registerSettingsHandlers();
  registerScriptHandlers();
  registerAgentHandlers();
  registerSystemProxyHandlers();
  registerTerminalHandlers();
  registerIgnoreRuleHandlers();
  registerShellHandlers();

  // Start LLM API server for Python scripts
  await LlmApiServer.getInstance().start();

  createWindow();

  // Initialize auto-updater
  initAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", async () => {
  // Cleanup proxy if running
  try {
    const { ProxyManager } = await import("./proxy/ProxyManager");
    await ProxyManager.getInstance().stop();
  } catch {
    // ignore
  }

  // Stop LLM API server
  try {
    await LlmApiServer.getInstance().stop();
  } catch {
    // ignore
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

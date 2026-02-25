import { dialog } from "electron";
import { autoUpdater } from "electron-updater";
import { getMainWindow } from "./index";

let updateCheckInProgress = false;

export function initAutoUpdater(): void {
  // Only check for updates in production
  if (process.env.NODE_ENV === "development") {
    console.log("Skipping update check in development mode");
    return;
  }

  // Configure auto updater
  autoUpdater.logger = console;
  autoUpdater.autoDownload = false; // Don't auto-download, let user decide
  autoUpdater.autoInstallOnAppQuit = false;

  // Event handlers
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for update...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info);
    
    const mainWindow = getMainWindow();
    if (mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: "info",
          title: "Update Available",
          message: `A new version (${info.version}) is available!`,
          detail: "Would you like to download and install it now?",
          buttons: ["Download & Install", "Later"],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.downloadUpdate();
          }
        });
    }
  });

  autoUpdater.on("update-not-available", () => {
    console.log("No updates available");
  });

  autoUpdater.on("error", (err) => {
    console.error("Update error:", err);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      const percent = Math.round(progressObj.percent);
      mainWindow.setProgressBar(percent / 100);
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.setProgressBar(-1); // Remove progress bar
      
      dialog
        .showMessageBox(mainWindow, {
          type: "info",
          title: "Update Ready",
          message: `ProxyBat ${info.version} has been downloaded.`,
          detail: "The application will restart to install the update.",
          buttons: ["Restart Now", "Later"],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
    }
  });

  // Check for updates after a short delay (let the app fully load first)
  setTimeout(() => {
    checkForUpdates();
  }, 5000);
}

export function checkForUpdates(): void {
  if (updateCheckInProgress) {
    return;
  }

  updateCheckInProgress = true;
  
  autoUpdater
    .checkForUpdates()
    .then(() => {
      updateCheckInProgress = false;
    })
    .catch((err) => {
      console.error("Failed to check for updates:", err);
      updateCheckInProgress = false;
    });
}

import type { IpcCertificateExport } from "@shared/ipc-contracts";
import { IPC } from "@shared/ipc-contracts";
import { dialog, ipcMain } from "electron";
import { copyFileSync } from "fs";
import { CertificateManager } from "../proxy/CertificateManager";

export function registerCertificateHandlers(): void {
  ipcMain.handle(IPC.CERTIFICATE.GET, async () => {
    const manager = CertificateManager.getInstance();
    await manager.initialize();
    return {
      info: manager.getCertInfo(),
      pemPath: manager.getCACertPath(),
    };
  });

  ipcMain.handle(
    IPC.CERTIFICATE.EXPORT,
    async (_event, params: IpcCertificateExport) => {
      try {
        const manager = CertificateManager.getInstance();
        await manager.initialize();

        let targetPath = params?.targetPath;
        if (!targetPath) {
          const result = await dialog.showSaveDialog({
            defaultPath: "ProxyBat-ca.crt",
            filters: [
              { name: "Certificate", extensions: ["crt", "pem"] },
              { name: "All Files", extensions: ["*"] },
            ],
          });
          if (result.canceled || !result.filePath) {
            return { success: false, error: "Cancelled" };
          }
          targetPath = result.filePath;
        }

        copyFileSync(manager.getCACertPath(), targetPath);
        return { success: true, path: targetPath };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  );

  ipcMain.handle(IPC.CERTIFICATE.REGENERATE, async () => {
    try {
      const manager = CertificateManager.getInstance();
      await manager.regenerate();
      return { success: true, info: manager.getCertInfo() };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}

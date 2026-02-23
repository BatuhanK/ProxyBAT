import { ipcMain } from "electron";
import { existsSync } from "fs";
import { platform } from "os";
import { spawnSync } from "child_process";
import { IPC } from "@shared/ipc-contracts";
import { SettingsStore } from "../storage/SettingsStore";
import type {
  DoctorBinaryStatus,
  DoctorCheckResult,
  DoctorInstallResult,
  DoctorInstallerPlan,
} from "@shared/types";

const MITMDUMP_CANDIDATES = [
  "mitmdump",
  "/opt/homebrew/bin/mitmdump",
  "/usr/local/bin/mitmdump",
  "/usr/bin/mitmdump",
];

const MITMPROXY_CANDIDATES = [
  "mitmproxy",
  "/opt/homebrew/bin/mitmproxy",
  "/usr/local/bin/mitmproxy",
  "/usr/bin/mitmproxy",
];

const BREW_CANDIDATES = ["brew", "/opt/homebrew/bin/brew", "/usr/local/bin/brew"];

function buildEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) env[k] = v;
  }
  const extra = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  const existing = (env["PATH"] || "").split(":");
  env["PATH"] = [...new Set([...extra, ...existing])].join(":");
  return env;
}

function resolveCommandPath(cmd: string): string | null {
  if (process.platform === "win32") {
    const res = spawnSync("where", [cmd], { encoding: "utf8" });
    if (res.status === 0 && res.stdout) return res.stdout.split(/\r?\n/)[0]?.trim() || null;
    return null;
  }
  const res = spawnSync("which", [cmd], { encoding: "utf8" });
  if (res.status === 0 && res.stdout) return res.stdout.split(/\r?\n/)[0]?.trim() || null;
  return null;
}

function commandExists(cmd: string): boolean {
  return resolveCommandPath(cmd) !== null;
}

function getVersion(cmd: string): { version?: string; error?: string } {
  try {
    const res = spawnSync(cmd, ["--version"], {
      encoding: "utf8",
      timeout: 3000,
      env: buildEnv(),
      shell: false,
    });
    if (res.status !== 0) {
      return { error: (res.stderr || res.stdout || "").trim() || "Failed" };
    }
    const line = (res.stdout || "").split(/\r?\n/)[0]?.trim();
    return { version: line || undefined };
  } catch (err) {
    return { error: String(err) };
  }
}

function getBinaryStatus(
  label: "mitmdump" | "mitmproxy",
  candidates: string[],
  configuredPath?: string | null,
): DoctorBinaryStatus {
  if (configuredPath && existsSync(configuredPath)) {
    const version = getVersion(configuredPath);
    return {
      found: true,
      path: configuredPath,
      version: version.version,
      error: version.error,
    };
  }

  for (const candidate of candidates) {
    if (candidate === label) {
      if (!commandExists(candidate)) continue;
      const resolved = resolveCommandPath(candidate) || candidate;
      const version = getVersion(candidate);
      return {
        found: true,
        path: resolved,
        version: version.version,
        error: version.error,
      };
    }
    if (existsSync(candidate)) {
      const version = getVersion(candidate);
      return {
        found: true,
        path: candidate,
        version: version.version,
        error: version.error,
      };
    }
  }

  return { found: false, error: `${label} not found` };
}

function detectInstaller(): DoctorInstallerPlan {
  const plat = platform();

  if (plat === "darwin") {
    const brew = BREW_CANDIDATES.find((c) => (c === "brew" ? commandExists("brew") : existsSync(c)));
    if (!brew) {
      return {
        supported: false,
        requiresAdmin: false,
        note: "Homebrew not found. Install Homebrew first.",
      };
    }
    return {
      supported: true,
      manager: "brew",
      command: "brew install mitmproxy",
      requiresAdmin: false,
    };
  }

  if (plat === "win32") {
    if (commandExists("winget")) {
      return {
        supported: true,
        manager: "winget",
        command: "winget install --id mitmproxy.mitmproxy -e",
        requiresAdmin: true,
      };
    }
    if (commandExists("choco")) {
      return {
        supported: true,
        manager: "choco",
        command: "choco install mitmproxy -y",
        requiresAdmin: true,
      };
    }
    return {
      supported: false,
      requiresAdmin: false,
      note: "winget or Chocolatey not found.",
    };
  }

  if (commandExists("apt-get")) {
    return {
      supported: true,
      manager: "apt",
      command: "apt-get update && apt-get install -y mitmproxy",
      requiresAdmin: true,
    };
  }
  if (commandExists("dnf")) {
    return {
      supported: true,
      manager: "dnf",
      command: "dnf install -y mitmproxy",
      requiresAdmin: true,
    };
  }
  if (commandExists("pacman")) {
    return {
      supported: true,
      manager: "pacman",
      command: "pacman -S --noconfirm mitmproxy",
      requiresAdmin: true,
    };
  }

  return {
    supported: false,
    requiresAdmin: false,
    note: "No supported package manager detected.",
  };
}

function runInstall(plan: DoctorInstallerPlan): DoctorInstallResult {
  if (!plan.supported || !plan.command) {
    return { success: false, error: plan.note ?? "Installer not available" };
  }

  const env = buildEnv();
  const plat = platform();
  let cmd = plan.command;

  if (plan.manager === "brew") {
    const brewPath = BREW_CANDIDATES.find((c) => (c === "brew" ? commandExists("brew") : existsSync(c)));
    if (brewPath && brewPath !== "brew") {
      cmd = cmd.replace(/^brew\b/, brewPath);
    }
  }

  try {
    if (plat === "darwin") {
      if (plan.requiresAdmin) {
        const osa = `do shell script "${cmd.replace(/"/g, '\\"')}" with administrator privileges`;
        const res = spawnSync("osascript", ["-e", osa], {
          encoding: "utf8",
          timeout: 20 * 60 * 1000,
        });
        if (res.status !== 0) {
          return { success: false, command: cmd, output: res.stdout || "", error: res.stderr || "" };
        }
        return { success: true, command: cmd, output: res.stdout || "" };
      }
      const res = spawnSync("bash", ["-lc", cmd], {
        encoding: "utf8",
        timeout: 20 * 60 * 1000,
        env,
      });
      if (res.status !== 0) {
        return { success: false, command: cmd, output: res.stdout || "", error: res.stderr || "" };
      }
      return { success: true, command: cmd, output: res.stdout || "" };
    }

    if (plat === "win32") {
      const psCommand =
        plan.manager === "winget" || plan.manager === "choco"
          ? `Start-Process ${plan.manager} -ArgumentList '${cmd.replace(/^[^ ]+\s*/, "")}' -Verb RunAs -Wait -PassThru | ForEach-Object { exit $_.ExitCode }`
          : `Start-Process cmd -ArgumentList '/c ${cmd}' -Verb RunAs -Wait -PassThru | ForEach-Object { exit $_.ExitCode }`;
      const res = spawnSync("powershell.exe", ["-NoProfile", "-Command", psCommand], {
        encoding: "utf8",
        timeout: 20 * 60 * 1000,
        env,
      });
      if (res.status !== 0) {
        return { success: false, command: cmd, output: res.stdout || "", error: res.stderr || "" };
      }
      return { success: true, command: cmd, output: res.stdout || "" };
    }

    const hasPkexec = commandExists("pkexec");
    const shellCmd = hasPkexec
      ? `pkexec /bin/sh -c "${cmd.replace(/"/g, '\\"')}"`
      : `sudo -n /bin/sh -c "${cmd.replace(/"/g, '\\"')}"`;
    const res = spawnSync("bash", ["-lc", shellCmd], {
      encoding: "utf8",
      timeout: 20 * 60 * 1000,
      env,
    });
    if (res.status !== 0) {
      return {
        success: false,
        command: cmd,
        output: res.stdout || "",
        error: res.stderr || "",
      };
    }
    return { success: true, command: cmd, output: res.stdout || "" };
  } catch (err) {
    return { success: false, command: cmd, error: String(err) };
  }
}

export function registerDoctorHandlers(): void {
  ipcMain.handle(IPC.DOCTOR.CHECK, (): DoctorCheckResult => {
    const settings = SettingsStore.getInstance();
    const configuredPath = settings.get("mitmdumpPath");
    const mitmdump = getBinaryStatus("mitmdump", MITMDUMP_CANDIDATES, configuredPath);
    const mitmproxy = getBinaryStatus("mitmproxy", MITMPROXY_CANDIDATES);
    const installer = detectInstaller();

    return {
      platform: process.platform,
      mitmdump,
      mitmproxy,
      installer,
    };
  });

  ipcMain.handle(IPC.DOCTOR.INSTALL_MITMPROXY, (): DoctorInstallResult => {
    const plan = detectInstaller();
    return runInstall(plan);
  });
}

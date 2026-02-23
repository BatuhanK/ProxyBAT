import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import type { DoctorCheckResult } from "@shared/types";
import { Stethoscope } from "lucide-react";
import { cn } from "@renderer/lib/utils";
import { Section } from "../components";

interface DoctorTabProps {
  doctorLoading: boolean;
  doctorResult: DoctorCheckResult | null;
  doctorInstallMsg: string;
  installingMitmproxy: boolean;
  loadDoctorStatus: () => void;
  installMitmproxy: () => void;
}

export function DoctorTab({
  doctorLoading,
  doctorResult,
  doctorInstallMsg,
  installingMitmproxy,
  loadDoctorStatus,
  installMitmproxy,
}: DoctorTabProps) {
  return (
    <div className="flex-1 overflow-auto pb-6">
      <Section title="Health Check" icon={<Stethoscope className="w-4 h-4" />}>
        <div className="flex items-center gap-2 mb-3">
          <Button
            size="sm"
            className="h-8"
            onClick={loadDoctorStatus}
            disabled={doctorLoading}
          >
            {doctorLoading ? "Checking..." : "Run Checks"}
          </Button>
          {doctorInstallMsg && (
            <span
              className={cn(
                "text-xs",
                doctorInstallMsg.toLowerCase().includes("failed")
                  ? "text-red-400"
                  : "text-green-400",
              )}
            >
              {doctorInstallMsg}
            </span>
          )}
        </div>

        {!doctorResult ? (
          <p className="text-xs text-muted-foreground italic">
            Run a health check to detect mitmproxy and system setup.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded border border-border p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">mitmdump</div>
                  <div className="text-sm font-mono">
                    {doctorResult.mitmdump.found
                      ? doctorResult.mitmdump.path
                      : "Not found"}
                  </div>
                  {doctorResult.mitmdump.version && (
                    <div className="text-xs text-muted-foreground">
                      {doctorResult.mitmdump.version}
                    </div>
                  )}
                  {doctorResult.mitmdump.error && (
                    <div className="text-xs text-red-400">
                      {doctorResult.mitmdump.error}
                    </div>
                  )}
                </div>
                <Badge
                  variant={doctorResult.mitmdump.found ? "default" : "secondary"}
                  className="text-xs py-0"
                >
                  {doctorResult.mitmdump.found ? "ok" : "missing"}
                </Badge>
              </div>
            </div>

            <div className="rounded border border-border p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">mitmproxy</div>
                  <div className="text-sm font-mono">
                    {doctorResult.mitmproxy.found
                      ? doctorResult.mitmproxy.path
                      : "Not found"}
                  </div>
                  {doctorResult.mitmproxy.version && (
                    <div className="text-xs text-muted-foreground">
                      {doctorResult.mitmproxy.version}
                    </div>
                  )}
                  {doctorResult.mitmproxy.error && (
                    <div className="text-xs text-red-400">
                      {doctorResult.mitmproxy.error}
                    </div>
                  )}
                </div>
                <Badge
                  variant={doctorResult.mitmproxy.found ? "default" : "secondary"}
                  className="text-xs py-0"
                >
                  {doctorResult.mitmproxy.found ? "ok" : "missing"}
                </Badge>
              </div>
            </div>

            <div className="rounded border border-border p-3 bg-muted/20">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Installer</div>
                  <div className="text-sm">
                    {doctorResult.installer.supported
                      ? `Using ${doctorResult.installer.manager}`
                      : "No supported package manager detected"}
                  </div>
                  {doctorResult.installer.command && (
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {doctorResult.installer.command}
                    </code>
                  )}
                  {doctorResult.installer.note && (
                    <div className="text-xs text-muted-foreground">
                      {doctorResult.installer.note}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={doctorResult.installer.supported ? "default" : "secondary"}
                    className="text-xs py-0"
                  >
                    {doctorResult.installer.supported ? "ready" : "missing"}
                  </Badge>
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={installMitmproxy}
                    disabled={
                      installingMitmproxy ||
                      !doctorResult.installer.supported ||
                      doctorResult.mitmproxy.found
                    }
                  >
                    {installingMitmproxy ? "Installing..." : "Install mitmproxy"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

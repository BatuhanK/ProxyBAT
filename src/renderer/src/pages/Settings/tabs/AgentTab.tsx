import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { FolderOpen, MessageSquare, Terminal } from "lucide-react";
import { Section } from "../components";
import { CURL_PRESETS } from "../constants";

interface AgentTabProps {
  workspaceDirInput: string;
  setWorkspaceDirInput: (value: string) => void;
  browseWorkspaceDir: () => void;
  saveWorkspaceDir: () => void;
  workspaceSaving: boolean;
  workspaceSaveMsg: string;
  curlBinaryInput: string;
  setCurlBinaryInput: (value: string) => void;
  saveCurlBinary: () => void;
  curlSaving: boolean;
  curlSaveMsg: string;
  activeCurlBinary: string;
}

export function AgentTab({
  workspaceDirInput,
  setWorkspaceDirInput,
  browseWorkspaceDir,
  saveWorkspaceDir,
  workspaceSaving,
  workspaceSaveMsg,
  curlBinaryInput,
  setCurlBinaryInput,
  saveCurlBinary,
  curlSaving,
  curlSaveMsg,
  activeCurlBinary,
}: AgentTabProps) {
  return (
    <div className="flex-1 overflow-auto pb-6">
      <Section
        title="Workspace"
        icon={<MessageSquare className="w-4 h-4" />}
      >
        <p className="text-xs text-muted-foreground mb-3">
          Files created by the AI agent during chat sessions are stored in a
          folder named after the session ID, inside this base directory.
        </p>
        <div className="flex items-center gap-2">
          <Input
            value={workspaceDirInput}
            onChange={(e) => setWorkspaceDirInput(e.target.value)}
            className="flex-1 h-8 text-sm font-mono"
            placeholder="~/Desktop/ProxyBat"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-shrink-0"
            onClick={browseWorkspaceDir}
          >
            <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
            Browse
          </Button>
          <Button
            size="sm"
            className="h-8 flex-shrink-0"
            onClick={saveWorkspaceDir}
            disabled={workspaceSaving}
          >
            {workspaceSaving ? "Saving..." : "Save"}
          </Button>
          {workspaceSaveMsg && (
            <span className="text-xs text-green-400">
              {workspaceSaveMsg}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Session files will be at{" "}
          <code className="bg-muted px-1 rounded">
            {workspaceDirInput || "…"}/{" <sessionId>"}
          </code>
        </p>
      </Section>

      <Section
        title="Tools — curl Binary"
        icon={<Terminal className="w-4 h-4" />}
      >
        <p className="text-xs text-muted-foreground mb-3">
          The Security Researcher agent sends test requests through the
          proxy using curl. Select a{" "}
          <code className="bg-muted px-1 rounded">curl-impersonate</code>{" "}
          binary to make requests look like real browser traffic and bypass
          TLS fingerprinting.
        </p>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-muted-foreground">
              curl Binary
            </label>
            <div className="flex gap-2">
              <select
                value={
                  CURL_PRESETS.some((p) => p.value === curlBinaryInput)
                    ? curlBinaryInput
                    : "__custom__"
                }
                onChange={(e) => {
                  if (e.target.value !== "__custom__")
                    setCurlBinaryInput(e.target.value);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CURL_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                {!CURL_PRESETS.some((p) => p.value === curlBinaryInput) && (
                  <option value="__custom__">Custom path…</option>
                )}
              </select>
              <Input
                value={curlBinaryInput}
                onChange={(e) => setCurlBinaryInput(e.target.value)}
                className="flex-1 h-8 text-xs font-mono"
                placeholder="/opt/homebrew/bin/curl_chrome110"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-4">
            <Button
              size="sm"
              className="h-8 flex-shrink-0"
              onClick={saveCurlBinary}
              disabled={curlSaving}
            >
              {curlSaving ? "Saving..." : "Save"}
            </Button>
          </div>
          {curlSaveMsg && (
            <span className="text-xs text-green-400 mt-4">
              {curlSaveMsg}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Active:{" "}
          <code className="bg-muted px-1 rounded">
            {activeCurlBinary || "curl"}
          </code>
        </p>
      </Section>
    </div>
  );
}

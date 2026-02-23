import { createAnthropic } from "@ai-sdk/anthropic";
import { createGitHubCopilotOpenAICompatible } from "@opeoginni/github-copilot-openai-compatible";
import { PUSH } from "@shared/ipc-contracts";
import type { ModelMessage } from "ai";
import { generateText, stepCountIs, streamText } from "ai";
import { codexCli } from "ai-sdk-provider-codex-cli";
import { BrowserWindow } from "electron";
import { mkdirSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { v4 as uuidv4 } from "uuid";
import { createZhipu } from "zhipu-ai-provider";
import type { AgentRole } from "./agents/registry";
import { getAgent } from "./agents/registry";
import { ChatStore } from "../storage/ChatStore";
import { SettingsStore } from "../storage/SettingsStore";

/**
 * Build an AI SDK model from the persisted AI provider settings.
 * Called fresh on every prompt / title generation so key/model changes take
 * effect immediately without restarting the app.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActiveModel(): any {
  const s = SettingsStore.getInstance().getAiProviderSettings();

  switch (s.activeProvider) {
    case "kimi": {
      const kimi = createAnthropic({
        baseURL: "https://api.kimi.com/coding/v1",
        apiKey: s.kimiApiKey,
        headers: {
          "anthropic-version": "2023-06-01",
          "user-agent":
            "opencode/1.2.10 ai-sdk/provider-utils/3.0.21 runtime/bun/1.3.9",
        },
      });
      return kimi(s.activeModel || "k2p5");
    }

    case "copilot": {
      const copilot = createGitHubCopilotOpenAICompatible({
        apiKey: s.copilotApiKey,
        headers: {
          "user-agent":
            "opencode/1.2.10 ai-sdk/provider-utils/3.0.21 runtime/bun/1.3.9, opencode/1.2.10",
        },
      });
      return copilot.chatModel(s.activeModel || "claude-sonnet-4.5");
    }

    case "zai": {
      const zai = createZhipu({
        baseURL: "https://api.z.ai/api/coding/paas/v4",
        apiKey: s.zaiApiKey,
        headers: {
          "user-agent":
            "opencode/1.2.10 ai-sdk/provider-utils/3.0.20 runtime/bun/1.3.9",
        },
      });
      return zai(s.activeModel || "glm-5");
    }

    case "codex": {
      const codexPath = s.codexPath || undefined;
      return codexCli(s.activeModel || "gpt-5.2-codex", { codexPath });
    }

    default: {
      // Fallback: Kimi with whatever key we have
      const kimi = createAnthropic({
        baseURL: "https://api.kimi.com/coding/v1",
        apiKey: s.kimiApiKey,
        headers: {
          "anthropic-version": "2023-06-01",
          "user-agent":
            "opencode/1.2.10 ai-sdk/provider-utils/3.0.21 runtime/bun/1.3.9",
        },
      });
      return kimi("k2p5");
    }
  }
}

/**
 * Build a lightweight model for title generation.
 * Uses the same provider/key as the active model, but always picks a
 * fast/cheap model variant when possible.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTitleModel(): any {
  const s = SettingsStore.getInstance().getAiProviderSettings();

  switch (s.activeProvider) {
    case "kimi": {
      const kimi = createAnthropic({
        baseURL: "https://api.kimi.com/coding/v1",
        apiKey: s.kimiApiKey,
        headers: {
          "anthropic-version": "2023-06-01",
          "user-agent":
            "opencode/1.2.10 ai-sdk/provider-utils/3.0.21 runtime/bun/1.3.9",
        },
      });
      return kimi("k2p5");
    }

    case "copilot": {
      const copilot = createGitHubCopilotOpenAICompatible({
        apiKey: s.copilotApiKey,
        headers: {
          "user-agent":
            "opencode/1.2.10 ai-sdk/provider-utils/3.0.21 runtime/bun/1.3.9, opencode/1.2.10",
        },
      });
      // Use a fast model for titles
      return copilot.chatModel("gpt-4o");
    }

    case "zai": {
      const zai = createZhipu({
        baseURL: "https://api.z.ai/api/coding/paas/v4",
        apiKey: s.zaiApiKey,
      });
      return zai("glm-5");
    }

    case "codex": {
      const codexPath = s.codexPath || undefined;
      return codexCli("gpt-5.2-codex", { codexPath });
    }

    default:
      return getActiveModel();
  }
}

function getWorkspacesRoot(): string {
  return SettingsStore.getInstance().getWorkspaceDir();
}


interface AgentSession {
  id: string;
  role: AgentRole;
  workspacePath: string;
  /** Proxy session ID that this agent session is analysing */
  linkedProxySessionId?: string;
  messages: ModelMessage[];
  createdAt: number;
  updatedAt: number;
  /** Whether a title has been auto-generated from the first message */
  titled: boolean;
}

export class AgentManager {
  private static instance: AgentManager;
  private sessions = new Map<string, AgentSession>();
  private activeSessionId: string | null = null;

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  async startSession(
    sessionId?: string,
    role: AgentRole = "general",
    linkedSessionId?: string,
    linkedProxySessionId?: string,
  ): Promise<string> {
    const id = sessionId ?? uuidv4();
    if (!this.sessions.has(id)) {
      // Get agent definition and compute workspace path
      const agent = getAgent(role);
      const workspacePath = agent.workspacePath({
        root: getWorkspacesRoot(),
        sessionId: id,
        linkedSessionId,
      });
      mkdirSync(workspacePath, { recursive: true });

      // Load messages from DB if session already existed
      const dbStore = ChatStore.getInstance();
      let dbSession = dbStore.getSession(id);
      if (!dbSession) {
        dbSession = dbStore.createSession(id, role, linkedProxySessionId);
      }

      const dbMessages = dbStore.listMessages(id);
      const messages: ModelMessage[] = dbMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // Use passed-in linkedProxySessionId, falling back to what's stored in DB
      const resolvedProxySessionId =
        linkedProxySessionId ?? dbSession.linked_proxy_session_id ?? undefined;

      this.sessions.set(id, {
        id,
        role: dbSession.role,
        workspacePath,
        linkedProxySessionId: resolvedProxySessionId,
        messages,
        createdAt: dbSession.created_at,
        updatedAt: dbSession.updated_at,
        titled: dbSession.title !== "New Chat",
      });
    }
    this.activeSessionId = id;
    return id;
  }

  async prompt(message: string, sessionId?: string): Promise<void> {
    // Use the explicitly passed sessionId to avoid race conditions where
    // activeSessionId may be mutated by a concurrent IPC call between awaits.
    const resolvedId = sessionId ?? this.activeSessionId;
    if (!resolvedId) {
      await this.startSession();
    }

    const session = this.sessions.get(resolvedId ?? this.activeSessionId!)!;
    const dbStore = ChatStore.getInstance();

    // Persist user message
    session.messages.push({ role: "user", content: message });
    session.updatedAt = Date.now();
    dbStore.appendMessage(session.id, "user", message);

    // Auto-generate title from first user message
    if (!session.titled) {
      session.titled = true;
      this._generateTitle(session.id, message).catch(() => {
        /* silent */
      });
    }

    // Get agent definition and build tools/system prompt
    const agent = getAgent(session.role);
    const agentContext = {
      sessionId: session.id,
      role: session.role,
      workspacePath: session.workspacePath,
      linkedProxySessionId: session.linkedProxySessionId,
    };
    const tools = agent.tools(agentContext);
    const systemPrompt = agent.systemPrompt(agentContext);

    // Capture session id at stream start so events are tagged even if activeSessionId changes
    const streamingSessionId = session.id;

    const result = streamText({
      model: getActiveModel(),
      system: systemPrompt,
      messages: session.messages,
      tools,
      stopWhen: stepCountIs(agent.maxSteps),
      maxOutputTokens: 32_000,
    });

    // Consume the stream — this drives events to the renderer
    let assistantText = "";
    for await (const chunk of result.fullStream) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = chunk as any;
      if (chunk.type === "text-delta") {
        const delta: string = c.textDelta ?? c.text ?? "";
        assistantText += delta;
        this.push(PUSH.AGENT_EVENT, {
          type: "text_delta",
          text: delta,
          sessionId: streamingSessionId,
        });
      } else if (chunk.type === "tool-call") {
        this.push(PUSH.AGENT_EVENT, {
          type: "tool_start",
          id: c.toolCallId,
          name: c.toolName,
          args: JSON.stringify(c.args ?? c.input),
          sessionId: streamingSessionId,
        });
      } else if (chunk.type === "tool-result") {
        const output = c.result ?? c.output;
        this.push(PUSH.AGENT_EVENT, {
          type: "tool_done",
          id: c.toolCallId,
          result: typeof output === "string" ? output : JSON.stringify(output),
          sessionId: streamingSessionId,
        });
      }
    }

    // Append response messages to in-memory history
    const { messages: responseMessages } = await result.response;
    for (const msg of responseMessages) {
      session.messages.push(msg as unknown as ModelMessage);
    }
    session.updatedAt = Date.now();

    // Persist the final assistant text to DB (the consolidated final answer)
    if (assistantText.trim()) {
      dbStore.appendMessage(session.id, "assistant", assistantText);
    }

    this.push(PUSH.AGENT_TURN_DONE, { sessionId: streamingSessionId });
  }

  /** Generate a short title from the first user message and persist it */
  private async _generateTitle(
    sessionId: string,
    firstMessage: string,
  ): Promise<void> {
    try {
      const { text } = await generateText({
        model: getTitleModel(),
        prompt: `Generate a very short chat title (3-6 words max) for a conversation that starts with the following message. Reply with ONLY the title, no punctuation, no quotes:\n\n"${firstMessage.slice(0, 300)}"`,
      });
      const title =
        text
          .trim()
          .replace(/^["']|["']$/g, "")
          .slice(0, 80) || "Chat";
      ChatStore.getInstance().updateTitle(sessionId, title);
      this.push(PUSH.AGENT_TITLE_UPDATED, { sessionId, title });
    } catch {
      // non-fatal — title stays as "New Chat"
    }
  }

  async listSessions(): Promise<
    Array<{
      id: string;
      title: string;
      role: AgentRole;
      linkedProxySessionId: string | null;
      updatedAt: number;
    }>
  > {
    const dbSessions = ChatStore.getInstance().listSessions();
    return dbSessions.map((s) => ({
      id: s.id,
      title: s.title,
      role: s.role,
      linkedProxySessionId: s.linked_proxy_session_id,
      updatedAt: s.updated_at,
    }));
  }

  async loadSessionMessages(
    sessionId: string,
  ): Promise<Array<{ role: string; content: string; created_at: number }>> {
    const dbMessages = ChatStore.getInstance().listMessages(sessionId);
    return dbMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      }));
  }

  async updateLinkedProxySession(
    sessionId: string,
    linkedProxySessionId: string | null,
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.linkedProxySessionId = linkedProxySessionId ?? undefined;
    }
    const dbSession = ChatStore.getInstance().getSession(sessionId);
    if (!dbSession) return false;
    ChatStore.getInstance().updateLinkedProxySession(
      sessionId,
      linkedProxySessionId,
    );
    return true;
  }

  private _walkWorkspace(
    dir: string,
    root: string,
  ): Array<{ path: string; size: number; modifiedAt: number }> {
    const results: Array<{ path: string; size: number; modifiedAt: number }> =
      [];
    let entries: string[];
    try {
      entries = readdirSync(dir) as unknown as string[];
    } catch {
      return results;
    }
    for (const entry of entries) {
      const abs = join(dir, entry);
      try {
        const stat = statSync(abs);
        if (stat.isDirectory()) {
          results.push(...this._walkWorkspace(abs, root));
        } else {
          results.push({
            path: relative(root, abs),
            size: stat.size,
            modifiedAt: stat.mtimeMs,
          });
        }
      } catch {
        // skip unreadable
      }
    }
    return results;
  }

  async listWorkspaceFiles(
    sessionId: string,
  ): Promise<Array<{ path: string; size: number; modifiedAt: number }>> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return this._walkWorkspace(session.workspacePath, session.workspacePath);
  }

  async readWorkspaceFile(
    sessionId: string,
    filePath: string,
  ): Promise<{ content: string; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) return { content: "", error: "Session not found" };
    try {
      // Prevent path traversal
      const abs = join(session.workspacePath, filePath);
      if (!abs.startsWith(session.workspacePath)) {
        return { content: "", error: "Path outside workspace" };
      }
      const content = readFileSync(abs, "utf8");
      return { content };
    } catch (err) {
      return { content: "", error: String(err) };
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const existed =
      this.sessions.has(sessionId) ||
      !!ChatStore.getInstance().getSession(sessionId);
    this.sessions.delete(sessionId);
    ChatStore.getInstance().deleteSession(sessionId);
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
    return existed;
  }

  async close(): Promise<void> {
    this.activeSessionId = null;
  }

  getCurrentSessionId(): string | null {
    return this.activeSessionId;
  }

  getWorkspacePath(sessionId: string): string | null {
    return this.sessions.get(sessionId)?.workspacePath ?? null;
  }

  private push(channel: string, data: unknown): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) win.webContents.send(channel, data);
    }
  }
}

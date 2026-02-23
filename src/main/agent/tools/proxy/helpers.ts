import { SessionStore } from "../../../storage/SessionStore";

export type SessionIdResult =
  | { sessionId: string }
  | { error: "No sessions found" };

export function getSessionIdOrDefault(sessionId?: string): SessionIdResult {
  if (sessionId) return { sessionId };
  const sessions = SessionStore.getInstance().list();
  if (sessions.length === 0) return { error: "No sessions found" };
  return { sessionId: sessions[0].id };
}

import WebSocket from "ws";
import type { ServerEvent } from "@driver-intercom/shared";

// Registry: sessionId → WebSocket
const registry = new Map<string, WebSocket>();

export function registerConnection(sessionId: string, ws: WebSocket): void {
  registry.set(sessionId, ws);
}

export function unregisterConnection(sessionId: string): void {
  registry.delete(sessionId);
}

export function getConnection(sessionId: string): WebSocket | undefined {
  return registry.get(sessionId);
}

export function getAllSessionIds(): string[] {
  return Array.from(registry.keys());
}

/** Send an event to a single session */
export function sendToSession(sessionId: string, event: ServerEvent): void {
  const ws = registry.get(sessionId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  }
}

/** Send an event to all sessions in a list */
export function broadcastToSessions(
  sessionIds: string[],
  event: ServerEvent
): void {
  const payload = JSON.stringify(event);
  for (const sid of sessionIds) {
    const ws = registry.get(sid);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import { parse as parseUrl } from "url";
import type { ClientEvent } from "@driver-intercom/shared";
import { registerConnection, sendToSession } from "./broadcaster";
import { handleLocationUpdate } from "./handlers/locationHandler";
import { handlePttStart, handlePttStop } from "./handlers/pttHandler";
import { handleDisconnect } from "./handlers/disconnectHandler";
import {
  createSession,
  getSession,
  setSessionRange,
  setSessionEnabled,
} from "../session/sessionStore";
import { generateRoomToken } from "../livekit/tokenService";
import { config } from "../config";
import {
  recordReport,
  getRecentReportCount,
} from "../redis/redisClient";
import { query } from "../db/pgClient";

export function attachWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const { query: qs } = parseUrl(req.url ?? "", true);
    const sessionId = typeof qs.sessionId === "string" ? qs.sessionId : null;

    if (!sessionId) {
      ws.close(4001, "sessionId required");
      return;
    }

    // Verify session exists
    let session = await getSession(sessionId);
    if (!session) {
      // Auto-create if connecting for the first time with a valid UUID format
      if (!/^[0-9a-f-]{36}$/.test(sessionId)) {
        ws.close(4002, "invalid sessionId");
        return;
      }
      await createSession(sessionId);
      session = await getSession(sessionId);
    }

    registerConnection(sessionId, ws);
    console.log(`[WS] connected: ${sessionId}`);

    // Keepalive ping every 30s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30_000);

    ws.on("message", async (raw) => {
      let event: ClientEvent;
      try {
        event = JSON.parse(raw.toString()) as ClientEvent;
      } catch {
        return;
      }

      switch (event.type) {
        case "location_update": {
          const { lat, lng, accuracy, heading, speed } = event.payload;
          await handleLocationUpdate(sessionId, lat, lng, accuracy, heading, speed);
          break;
        }

        case "ptt_start":
          await handlePttStart(sessionId);
          break;

        case "ptt_stop":
          await handlePttStop(sessionId);
          break;

        case "set_range": {
          await setSessionRange(sessionId, event.payload.rangeKm);
          break;
        }

        case "set_enabled": {
          await setSessionEnabled(sessionId, event.payload.enabled);
          break;
        }

        case "report_driver": {
          const { targetSessionId, reason } = event.payload;
          await recordReport(targetSessionId, sessionId);
          // Persist to DB
          await query(
            "INSERT INTO abuse_reports (reporter_id, target_id, reason, reported_at) VALUES ($1, $2, $3, $4)",
            [sessionId, targetSessionId, reason, Date.now()]
          );
          // Check if target should be auto-muted
          const count = await getRecentReportCount(
            targetSessionId,
            config.reportMuteWindowMs
          );
          if (count >= config.reportMuteThreshold) {
            await setSessionEnabled(targetSessionId, false);
          }
          break;
        }

        case "ping":
          sendToSession(sessionId, { type: "pong" });
          break;
      }
    });

    ws.on("close", async () => {
      clearInterval(pingInterval);
      console.log(`[WS] disconnected: ${sessionId}`);
      await handleDisconnect(sessionId);
    });

    ws.on("error", (err) => {
      console.error(`[WS] error for ${sessionId}:`, err.message);
    });
  });

  return wss;
}

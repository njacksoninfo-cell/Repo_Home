import { WS_URL } from "../lib/constants";
import type { ClientEvent, ServerEvent } from "@driver-intercom/shared";
import { useChannelStore } from "../store/channelStore";
import { useAudioStore } from "../store/audioStore";
import { useSessionStore } from "../store/sessionStore";

type EventHandler = (event: ServerEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers: Set<EventHandler> = new Set();
  private intentionalClose = false;
  private sendQueue: string[] = [];

  connect(sessionId: string): void {
    this.sessionId = sessionId;
    this.intentionalClose = false;
    this._open();
  }

  private _open(): void {
    if (!this.sessionId) return;
    const url = `${WS_URL}?sessionId=${this.sessionId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] connected");
      this.reconnectAttempts = 0;
      // Flush queued messages
      while (this.sendQueue.length > 0) {
        this.ws?.send(this.sendQueue.shift()!);
      }
    };

    this.ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as ServerEvent;
        this._dispatch(event);
      } catch {
        // ignore malformed
      }
    };

    this.ws.onclose = () => {
      if (!this.intentionalClose) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error("[WS] error", err);
    };
  }

  private _dispatch(event: ServerEvent): void {
    // Update stores directly for core events
    switch (event.type) {
      case "room_assign":
      case "room_reassign":
        useChannelStore
          .getState()
          .setRoom(
            event.payload.roomId,
            event.payload.livekitToken,
            event.payload.livekitUrl
          );
        break;
      case "nearby_count":
        useChannelStore.getState().setNearbyCount(event.payload.count);
        break;
      case "speaker_start":
        useAudioStore.getState().addSpeaker({
          sessionId: event.payload.sessionId,
          vehicle: event.payload.vehicle,
          distanceMi: event.payload.distanceMi,
          bearingDeg: event.payload.bearingDeg,
          isRegular: event.payload.isRegular,
          startedAt: Date.now(),
        });
        break;
      case "speaker_stop":
        useAudioStore.getState().removeSpeaker(event.payload.sessionId);
        break;
    }

    // Also dispatch to any registered handlers (hooks, CarPlay, etc.)
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  private _scheduleReconnect(): void {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
    this.reconnectAttempts++;
    console.log(`[WS] reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => this._open(), delay);
  }

  send(event: ClientEvent): void {
    const payload = JSON.stringify(event);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      // Buffer while reconnecting
      this.sendQueue.push(payload);
    }
  }

  addHandler(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

export const wsService = new WebSocketService();

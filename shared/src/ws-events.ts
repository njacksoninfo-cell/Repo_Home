import type { VehicleProfile } from "./models";

// ─── Client → Server ────────────────────────────────────────────────────────

export type ClientEvent =
  | {
      type: "location_update";
      payload: {
        lat: number;
        lng: number;
        accuracy: number;
        heading: number | null;
        speed: number | null;
      };
    }
  | { type: "ptt_start" }
  | { type: "ptt_stop" }
  | { type: "set_range"; payload: { rangeKm: number } }
  | { type: "set_enabled"; payload: { enabled: boolean } }
  | { type: "report_driver"; payload: { targetSessionId: string; reason: string } }
  | { type: "ping" };

// ─── Server → Client ────────────────────────────────────────────────────────

export type ServerEvent =
  | {
      type: "room_assign";
      payload: { roomId: string; livekitToken: string; livekitUrl: string };
    }
  | {
      type: "room_reassign";
      payload: { roomId: string; livekitToken: string; livekitUrl: string };
    }
  | { type: "nearby_count"; payload: { count: number } }
  | {
      type: "speaker_start";
      payload: {
        sessionId: string;
        vehicle: VehicleProfile;
        distanceMi: number | null;
        bearingDeg: number | null;
        isRegular: boolean;
      };
    }
  | { type: "speaker_stop"; payload: { sessionId: string } }
  | {
      type: "driver_joined";
      payload: { count: number; vehicle: VehicleProfile; isRegular: boolean };
    }
  | { type: "driver_left"; payload: { count: number } }
  | {
      type: "wave_received";
      payload: { fromSessionId: string; vehicle: VehicleProfile };
    }
  | { type: "pong" };

import { AccessToken } from "livekit-server-sdk";
import { config } from "../config";

const TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export function generateRoomToken(
  sessionId: string,
  roomId: string
): string {
  const at = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
    identity: sessionId,
    ttl: TOKEN_TTL_SECONDS,
  });

  at.addGrant({
    roomJoin: true,
    room: roomId,
    canPublish: true,
    canSubscribe: true,
    canPublishData: false, // voice only
  });

  return at.toJwt() as unknown as string;
}

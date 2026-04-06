import { useEffect, useRef } from "react";
import { useChannelStore } from "../store/channelStore";
import { livekitService } from "../services/LiveKitService";
import { useAudioStore } from "../store/audioStore";

/**
 * Watches the channel store for room changes and manages the LiveKit connection.
 * When the room assignment changes, silently disconnects from the old room
 * and connects to the new one.
 */
export function useRoomConnection(): void {
  const { currentRoomId, livekitToken, livekitUrl } = useChannelStore();
  const prevRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentRoomId || !livekitToken || !livekitUrl) return;
    if (prevRoomRef.current === currentRoomId) return;

    prevRoomRef.current = currentRoomId;

    (async () => {
      // Clear speakers from old room
      useAudioStore.getState().clearSpeakers();

      try {
        await livekitService.connect(livekitUrl, livekitToken);
        console.log(`[RoomConnection] joined room: ${currentRoomId}`);
      } catch (err) {
        console.error("[RoomConnection] failed to connect:", err);
      }
    })();
  }, [currentRoomId, livekitToken, livekitUrl]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      livekitService.disconnect();
    };
  }, []);
}

import { useCallback, useRef } from "react";
import { wsService } from "../services/WebSocketService";
import { livekitService } from "../services/LiveKitService";
import { useAudioStore } from "../store/audioStore";
import { useSessionStore } from "../store/sessionStore";

const PTT_DEBOUNCE_MS = 100;

interface PTTHandlers {
  onPressIn: () => void;
  onPressOut: () => void;
}

/**
 * Push-to-talk hook.
 * Manages the mic publish/unpublish lifecycle and WS ptt_start/ptt_stop events.
 */
export function usePTT(): PTTHandlers {
  const pressStartRef = useRef<number | null>(null);
  const { enabled } = useSessionStore();
  const { setPttActive } = useAudioStore();

  const onPressIn = useCallback(() => {
    if (!enabled) return;
    pressStartRef.current = Date.now();

    // Start PTT after debounce
    setTimeout(async () => {
      if (pressStartRef.current === null) return; // already released

      wsService.send({ type: "ptt_start" });
      await livekitService.publishMic();
      setPttActive(true);
    }, PTT_DEBOUNCE_MS);
  }, [enabled, setPttActive]);

  const onPressOut = useCallback(async () => {
    pressStartRef.current = null;
    wsService.send({ type: "ptt_stop" });
    await livekitService.unpublishMic();
    setPttActive(false);
  }, [setPttActive]);

  return { onPressIn, onPressOut };
}

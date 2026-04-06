import { useEffect } from "react";
import { wsService } from "../services/WebSocketService";
import type { ServerEvent } from "@driver-intercom/shared";

/**
 * Subscribe to driver_joined / driver_left events for side effects
 * (e.g., subtle sound or notification).
 * Store updates are handled directly in WebSocketService._dispatch().
 */
export function useNearbyDrivers(): void {
  useEffect(() => {
    const remove = wsService.addHandler((event: ServerEvent) => {
      if (event.type === "driver_joined") {
        // Could trigger a subtle chime here
      }
      if (event.type === "driver_left") {
        // Could trigger a subtle out-sound here
      }
    });
    return remove;
  }, []);
}

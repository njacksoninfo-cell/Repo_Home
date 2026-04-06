import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { API_BASE_URL } from "../lib/constants";
import { useSessionStore } from "../store/sessionStore";

const SESSION_KEY = "@di_session_id";

/**
 * Initialize the session on app launch.
 * Loads existing sessionId from storage or creates a new one via the API.
 */
export async function initSession(): Promise<string> {
  // Try to load existing session
  let sessionId = await AsyncStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    // Generate client-side UUID first (optimistic)
    sessionId = uuidv4();

    try {
      const res = await fetch(`${API_BASE_URL}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as { sessionId: string };
        sessionId = data.sessionId;
      }
    } catch {
      // Network unavailable — use local UUID; will sync when connected
      console.warn("[Session] API unreachable, using local UUID");
    }

    await AsyncStorage.setItem(SESSION_KEY, sessionId);
  }

  useSessionStore.getState().setSessionId(sessionId);
  return sessionId;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
  useSessionStore.getState().setSessionId(null as unknown as string);
}

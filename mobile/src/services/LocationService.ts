import BackgroundGeolocation, {
  type Location,
} from "react-native-background-geolocation";
import { wsService } from "./WebSocketService";
import { useSessionStore } from "../store/sessionStore";
import { MAX_SAFE_SPEED_MS } from "@driver-intercom/shared";

let configured = false;

export async function configureLocationService(): Promise<void> {
  if (configured) return;
  configured = true;

  await BackgroundGeolocation.ready({
    // Geolocation config
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    distanceFilter: 5, // meters
    locationUpdateInterval: 4000, // ms (Android)
    fastestLocationUpdateInterval: 2000,
    stopOnTerminate: false,
    startOnBoot: false,

    // Activity recognition
    stopTimeout: 5, // minutes of stillness before pausing

    // iOS specific
    activityType: BackgroundGeolocation.ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION,
    showsBackgroundLocationIndicator: true,

    // Android foreground service notification
    notification: {
      title: "Driver Intercom",
      text: "Listening for nearby drivers",
      smallIcon: "mipmap/ic_launcher_round",
    },

    // Debug off in production
    debug: false,
    logLevel: BackgroundGeolocation.LOG_LEVEL_WARNING,
  });

  BackgroundGeolocation.onLocation((location: Location) => {
    const { enabled } = useSessionStore.getState();
    if (!enabled) return;

    const speed = location.coords.speed ?? null;

    wsService.send({
      type: "location_update",
      payload: {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading ?? null,
        speed,
      },
    });
  });
}

export async function startLocationTracking(): Promise<void> {
  await BackgroundGeolocation.start();
}

export async function stopLocationTracking(): Promise<void> {
  await BackgroundGeolocation.stop();
}

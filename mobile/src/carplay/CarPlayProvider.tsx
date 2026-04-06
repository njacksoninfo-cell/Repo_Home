import { useEffect } from "react";
import CarPlay, {
  CPListTemplate,
  CPAlertTemplate,
  CPActionSheetTemplate,
} from "react-native-carplay";
import { useChannelStore } from "../store/channelStore";
import { useAudioStore } from "../store/audioStore";
import { useSessionStore } from "../store/sessionStore";
import { wsService } from "../services/WebSocketService";
import { livekitService } from "../services/LiveKitService";
import { RANGE_OPTIONS_KM, RANGE_LABELS, type RangeKm } from "@driver-intercom/shared";
import { vehicleDisplayName } from "@driver-intercom/shared";
import { bearingToCompass, formatDistance } from "../lib/geoUtils";

let pttActive = false;

function buildRootTemplate() {
  const { nearbyCount } = useChannelStore.getState();
  const { activeSpeakers } = useAudioStore.getState();
  const { enabled, rangeKm } = useSessionStore.getState();

  const speakerItems = activeSpeakers.map((s) => {
    const distStr =
      s.distanceMi !== null ? formatDistance(s.distanceMi) : "";
    const dirStr =
      s.bearingDeg !== null ? bearingToCompass(s.bearingDeg) : "";
    return new CPListTemplate({
      sections: [],
      title: `${vehicleDisplayName(s.vehicle)} · ${distStr} ${dirStr}`.trim(),
      trailingNavigationBarButtons: [],
    });
  });

  const statusText = enabled
    ? `${nearbyCount} driver${nearbyCount !== 1 ? "s" : ""} nearby · ${RANGE_LABELS[rangeKm]}`
    : "Intercom is OFF";

  return new CPListTemplate({
    title: "Driver Intercom",
    sections: [
      {
        header: statusText,
        items: [
          {
            text: pttActive ? "Release to stop" : "Hold to Talk",
            detailText: pttActive ? "Transmitting..." : "Press and hold",
            isPlaying: pttActive,
            handler: () => {
              // CarPlay tap toggles PTT (hold-to-talk isn't available natively)
              if (pttActive) {
                wsService.send({ type: "ptt_stop" });
                livekitService.unpublishMic();
                pttActive = false;
              } else {
                wsService.send({ type: "ptt_start" });
                livekitService.publishMic();
                pttActive = true;
              }
              // Rebuild template to reflect state
              CarPlay.setRootTemplate(buildRootTemplate());
            },
          },
          ...activeSpeakers.map((s) => ({
            text: vehicleDisplayName(s.vehicle),
            detailText: [
              s.distanceMi !== null ? formatDistance(s.distanceMi) : "",
              s.bearingDeg !== null ? bearingToCompass(s.bearingDeg) : "",
              s.isRegular ? "Regular" : "",
            ]
              .filter(Boolean)
              .join(" · "),
          })),
        ],
      },
      {
        header: "Options",
        items: [
          {
            text: enabled ? "Turn Intercom OFF" : "Turn Intercom ON",
            handler: () => {
              const next = !useSessionStore.getState().enabled;
              useSessionStore.getState().setEnabled(next);
              wsService.send({ type: "set_enabled", payload: { enabled: next } });
              CarPlay.setRootTemplate(buildRootTemplate());
            },
          },
          {
            text: `Range: ${RANGE_LABELS[rangeKm]}`,
            handler: () => {
              const sheet = new CPActionSheetTemplate({
                title: "Select Range",
                message: "How far should the intercom reach?",
                actions: RANGE_OPTIONS_KM.map((r) => ({
                  title: RANGE_LABELS[r],
                  handler: () => {
                    useSessionStore.getState().setRangeKm(r);
                    wsService.send({ type: "set_range", payload: { rangeKm: r } });
                    CarPlay.popTemplate(false);
                    CarPlay.setRootTemplate(buildRootTemplate());
                  },
                })),
              });
              CarPlay.pushTemplate(sheet, true);
            },
          },
        ],
      },
    ],
    trailingNavigationBarButtons: [],
  });
}

export function CarPlayProvider(): null {
  useEffect(() => {
    const connectSub = CarPlay.registerOnConnect(() => {
      console.log("[CarPlay] connected");
      CarPlay.setRootTemplate(buildRootTemplate());
    });

    const disconnectSub = CarPlay.registerOnDisconnect(() => {
      console.log("[CarPlay] disconnected");
      // Stop any active PTT when CarPlay disconnects
      if (pttActive) {
        wsService.send({ type: "ptt_stop" });
        livekitService.unpublishMic();
        pttActive = false;
      }
    });

    // Listen to store changes to keep CarPlay UI fresh
    const unsubChannel = useChannelStore.subscribe(() => {
      if (CarPlay.connected) CarPlay.setRootTemplate(buildRootTemplate());
    });

    const unsubAudio = useAudioStore.subscribe(() => {
      if (CarPlay.connected) CarPlay.setRootTemplate(buildRootTemplate());
    });

    return () => {
      connectSub?.remove?.();
      disconnectSub?.remove?.();
      unsubChannel();
      unsubAudio();
    };
  }, []);

  return null;
}

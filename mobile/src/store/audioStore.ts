import { create } from "zustand";
import type { VehicleProfile } from "@proximity/shared";

export interface SpeakerEntry {
  sessionId: string;
  vehicle: VehicleProfile;
  distanceMi: number | null;
  bearingDeg: number | null;
  isRegular: boolean;
  startedAt: number;
}

interface AudioState {
  pttActive: boolean;
  activeSpeakers: SpeakerEntry[];
  // Actions
  setPttActive: (active: boolean) => void;
  addSpeaker: (speaker: SpeakerEntry) => void;
  removeSpeaker: (sessionId: string) => void;
  clearSpeakers: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  pttActive: false,
  activeSpeakers: [],

  setPttActive: (active) => set({ pttActive: active }),

  addSpeaker: (speaker) =>
    set((state) => ({
      activeSpeakers: [
        ...state.activeSpeakers.filter((s) => s.sessionId !== speaker.sessionId),
        speaker,
      ],
    })),

  removeSpeaker: (sessionId) =>
    set((state) => ({
      activeSpeakers: state.activeSpeakers.filter((s) => s.sessionId !== sessionId),
    })),

  clearSpeakers: () => set({ activeSpeakers: [] }),
}));

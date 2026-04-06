import { create } from "zustand";
import type { VehicleProfile } from "@proximity/shared";
import { DEFAULT_RANGE_KM, type RangeKm } from "@proximity/shared";

interface SessionState {
  sessionId: string | null;
  vehicle: VehicleProfile | null;
  rangeKm: RangeKm;
  enabled: boolean;
  // Actions
  setSessionId: (id: string) => void;
  setVehicle: (v: VehicleProfile) => void;
  setRangeKm: (r: RangeKm) => void;
  setEnabled: (e: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  vehicle: null,
  rangeKm: DEFAULT_RANGE_KM,
  enabled: false, // OFF by default — user must opt in

  setSessionId: (id) => set({ sessionId: id }),
  setVehicle: (v) => set({ vehicle: v }),
  setRangeKm: (r) => set({ rangeKm: r }),
  setEnabled: (e) => set({ enabled: e }),
}));

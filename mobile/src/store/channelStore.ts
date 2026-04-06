import { create } from "zustand";

interface ChannelState {
  currentRoomId: string | null;
  livekitToken: string | null;
  livekitUrl: string | null;
  nearbyCount: number;
  // Actions
  setRoom: (roomId: string, token: string, url: string) => void;
  setNearbyCount: (n: number) => void;
  clearRoom: () => void;
}

export const useChannelStore = create<ChannelState>((set) => ({
  currentRoomId: null,
  livekitToken: null,
  livekitUrl: null,
  nearbyCount: 0,

  setRoom: (roomId, token, url) =>
    set({ currentRoomId: roomId, livekitToken: token, livekitUrl: url }),
  setNearbyCount: (n) => set({ nearbyCount: n }),
  clearRoom: () =>
    set({ currentRoomId: null, livekitToken: null, livekitUrl: null, nearbyCount: 0 }),
}));

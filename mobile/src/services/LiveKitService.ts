import {
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
} from "@livekit/react-native";

class LiveKitService {
  private room: Room | null = null;
  private micTrack: ReturnType<typeof createLocalAudioTrack> extends Promise<infer T> ? T : never | null = null;

  async connect(url: string, token: string): Promise<void> {
    if (this.room) {
      await this.disconnect();
    }

    this.room = new Room();

    this.room.on(RoomEvent.Disconnected, () => {
      console.log("[LiveKit] disconnected from room");
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      console.log("[LiveKit] reconnecting...");
    });

    await this.room.connect(url, token, {
      autoSubscribe: true,
    });

    console.log(`[LiveKit] connected to room: ${this.room.name}`);
  }

  async disconnect(): Promise<void> {
    if (this.micTrack) {
      await this.unpublishMic();
    }
    await this.room?.disconnect();
    this.room = null;
  }

  async publishMic(): Promise<void> {
    if (!this.room) return;
    if (this.micTrack) return; // already publishing

    try {
      const track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      await this.room.localParticipant.publishTrack(track);
      this.micTrack = track as any;
      console.log("[LiveKit] mic published");
    } catch (err) {
      console.error("[LiveKit] failed to publish mic:", err);
    }
  }

  async unpublishMic(): Promise<void> {
    if (!this.room || !this.micTrack) return;
    try {
      await this.room.localParticipant.unpublishTrack(this.micTrack as any);
      this.micTrack = null;
      console.log("[LiveKit] mic unpublished");
    } catch (err) {
      console.error("[LiveKit] failed to unpublish mic:", err);
    }
  }

  isConnected(): boolean {
    return this.room?.state === "connected";
  }

  getRoomName(): string | null {
    return this.room?.name ?? null;
  }
}

export const livekitService = new LiveKitService();

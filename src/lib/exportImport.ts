import type { Annotation } from "@/types/annotation";
import type { BallState, PositionedPlayer, AppMode } from "@/types/board";

export interface ExportedBoardState {
  version: 1;
  timestamp: string;
  mode: AppMode;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeFormationId: string | null;
  awayFormationId: string | null;
  playerPositions: Record<string, PositionedPlayer>;
  ball: BallState;
  annotations: Annotation[];
  uploadedImage?: string;
}

export function exportToJSON(state: {
  mode: AppMode;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeFormationId: string | null;
  awayFormationId: string | null;
  playerPositions: Record<string, PositionedPlayer>;
  ball: BallState;
  annotations: Annotation[];
  uploadedImage: string | null;
}): string {
  const exported: ExportedBoardState = {
    version: 1,
    timestamp: new Date().toISOString(),
    mode: state.mode,
    homeTeamId: state.homeTeamId,
    awayTeamId: state.awayTeamId,
    homeFormationId: state.homeFormationId,
    awayFormationId: state.awayFormationId,
    playerPositions: state.playerPositions,
    ball: state.ball,
    annotations: state.annotations,
    ...(state.uploadedImage ? { uploadedImage: state.uploadedImage } : {}),
  };
  return JSON.stringify(exported, null, 2);
}

export function downloadJSON(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedJSON(json: string): ExportedBoardState | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.version !== 1) return null;
    return parsed as ExportedBoardState;
  } catch {
    return null;
  }
}

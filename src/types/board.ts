import type { Team } from "./team";
import type { Formation } from "./formation";
import type { Annotation, AnnotationType } from "./annotation";

export interface PositionedPlayer {
  playerId: string;
  teamSide: "home" | "away";
  x: number;
  y: number;
}

export interface BallState {
  x: number;
  y: number;
  visible: boolean;
}

export type AppMode = "pitch" | "media";

export type ActiveTool = AnnotationType | "select";

export interface HistorySnapshot {
  playerPositions: Record<string, PositionedPlayer>;
  ball: BallState;
  annotations: Annotation[];
}

export interface BoardState {
  mode: AppMode;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeFormation: Formation | null;
  awayFormation: Formation | null;
  playerPositions: Record<string, PositionedPlayer>;
  ball: BallState;
  annotations: Annotation[];
  activeTool: ActiveTool;
  toolColor: string;
  toolStrokeWidth: number;
  uploadedImage: string | null;
  history: HistorySnapshot[];
  historyIndex: number;
}

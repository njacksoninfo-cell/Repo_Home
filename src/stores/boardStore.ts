import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Team } from "@/types/team";
import type { Formation } from "@/types/formation";
import type { Annotation, AnnotationType } from "@/types/annotation";
import type {
  BoardState,
  PositionedPlayer,
  BallState,
  AppMode,
  ActiveTool,
  HistorySnapshot,
} from "@/types/board";
import { DEFAULT_ANNOTATION_COLOR, DEFAULT_STROKE_WIDTH } from "@/lib/colors";

const MAX_HISTORY = 50;

function createSnapshot(state: BoardState): HistorySnapshot {
  return {
    playerPositions: JSON.parse(JSON.stringify(state.playerPositions)),
    ball: { ...state.ball },
    annotations: JSON.parse(JSON.stringify(state.annotations)),
  };
}

interface BoardActions {
  setMode: (mode: AppMode) => void;
  setHomeTeam: (team: Team | null) => void;
  setAwayTeam: (team: Team | null) => void;
  setHomeFormation: (formation: Formation | null) => void;
  setAwayFormation: (formation: Formation | null) => void;
  setPlayerPositions: (positions: Record<string, PositionedPlayer>) => void;
  updatePlayerPosition: (playerId: string, x: number, y: number) => void;
  resetPlayerPositions: () => void;
  updateBallPosition: (x: number, y: number) => void;
  toggleBallVisibility: () => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  setActiveTool: (tool: ActiveTool) => void;
  setToolColor: (color: string) => void;
  setToolStrokeWidth: (width: number) => void;
  setUploadedImage: (dataUrl: string | null) => void;
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  importState: (state: {
    mode: AppMode;
    playerPositions: Record<string, PositionedPlayer>;
    ball: BallState;
    annotations: Annotation[];
    uploadedImage: string | null;
  }) => void;
}

type BoardStore = BoardState & BoardActions;

const initialBall: BallState = { x: 0, y: 0, visible: false };

export const useBoardStore = create<BoardStore>()(
  immer((set) => ({
    // State
    mode: "pitch" as AppMode,
    homeTeam: null,
    awayTeam: null,
    homeFormation: null,
    awayFormation: null,
    playerPositions: {},
    ball: initialBall,
    annotations: [],
    activeTool: "select" as ActiveTool,
    toolColor: DEFAULT_ANNOTATION_COLOR,
    toolStrokeWidth: DEFAULT_STROKE_WIDTH,
    uploadedImage: null,
    history: [],
    historyIndex: -1,

    // Actions
    setMode: (mode) =>
      set((state) => {
        state.mode = mode;
      }),

    setHomeTeam: (team) =>
      set((state) => {
        state.homeTeam = team;
      }),

    setAwayTeam: (team) =>
      set((state) => {
        state.awayTeam = team;
      }),

    setHomeFormation: (formation) =>
      set((state) => {
        state.homeFormation = formation;
      }),

    setAwayFormation: (formation) =>
      set((state) => {
        state.awayFormation = formation;
      }),

    setPlayerPositions: (positions) =>
      set((state) => {
        state.playerPositions = positions;
      }),

    updatePlayerPosition: (playerId, x, y) =>
      set((state) => {
        if (state.playerPositions[playerId]) {
          state.playerPositions[playerId].x = x;
          state.playerPositions[playerId].y = y;
        }
      }),

    resetPlayerPositions: () =>
      set((state) => {
        state.playerPositions = {};
      }),

    updateBallPosition: (x, y) =>
      set((state) => {
        state.ball.x = x;
        state.ball.y = y;
      }),

    toggleBallVisibility: () =>
      set((state) => {
        state.ball.visible = !state.ball.visible;
      }),

    addAnnotation: (annotation) =>
      set((state) => {
        state.annotations.push(annotation);
      }),

    updateAnnotation: (id, updates) =>
      set((state) => {
        const idx = state.annotations.findIndex((a) => a.id === id);
        if (idx !== -1) {
          Object.assign(state.annotations[idx], updates);
        }
      }),

    removeAnnotation: (id) =>
      set((state) => {
        state.annotations = state.annotations.filter((a) => a.id !== id);
      }),

    clearAnnotations: () =>
      set((state) => {
        state.annotations = [];
      }),

    setActiveTool: (tool) =>
      set((state) => {
        state.activeTool = tool;
      }),

    setToolColor: (color) =>
      set((state) => {
        state.toolColor = color;
      }),

    setToolStrokeWidth: (width) =>
      set((state) => {
        state.toolStrokeWidth = width;
      }),

    setUploadedImage: (dataUrl) =>
      set((state) => {
        state.uploadedImage = dataUrl;
      }),

    pushSnapshot: () =>
      set((state) => {
        const snapshot = createSnapshot(state);
        // Truncate any redo history
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        if (state.history.length > MAX_HISTORY) {
          state.history = state.history.slice(state.history.length - MAX_HISTORY);
        }
        state.historyIndex = state.history.length - 1;
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          const snapshot = state.history[state.historyIndex];
          state.playerPositions = JSON.parse(JSON.stringify(snapshot.playerPositions));
          state.ball = { ...snapshot.ball };
          state.annotations = JSON.parse(JSON.stringify(snapshot.annotations));
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          const snapshot = state.history[state.historyIndex];
          state.playerPositions = JSON.parse(JSON.stringify(snapshot.playerPositions));
          state.ball = { ...snapshot.ball };
          state.annotations = JSON.parse(JSON.stringify(snapshot.annotations));
        }
      }),

    importState: (imported) =>
      set((state) => {
        state.mode = imported.mode;
        state.playerPositions = imported.playerPositions;
        state.ball = imported.ball;
        state.annotations = imported.annotations;
        state.uploadedImage = imported.uploadedImage;
      }),
  }))
);

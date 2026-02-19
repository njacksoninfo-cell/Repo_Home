"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import TeamSelector from "@/components/toolbar/TeamSelector";
import FormationSelector from "@/components/toolbar/FormationSelector";
import ModeToggle from "@/components/toolbar/ModeToggle";
import AnnotationTools from "@/components/toolbar/AnnotationTools";
import ColorPicker from "@/components/toolbar/ColorPicker";
import StrokeWidthPicker from "@/components/toolbar/StrokeWidthPicker";
import UndoRedoButtons from "@/components/toolbar/UndoRedoButtons";
import ActionButtons from "@/components/toolbar/ActionButtons";
import { useBoardStore } from "@/stores/boardStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { calculatePitchLayout } from "@/lib/pitchDimensions";
import {
  assignPlayersToFormation,
  getStartingEleven,
} from "@/lib/formationEngine";

// Dynamic imports for canvas components (no SSR)
const PitchCanvas = dynamic(
  () => import("@/components/board/PitchCanvas"),
  { ssr: false }
);
const MediaCanvas = dynamic(
  () => import("@/components/board/MediaCanvas"),
  { ssr: false }
);

export default function TacticsBoard() {
  const mode = useBoardStore((s) => s.mode);
  const homeTeam = useBoardStore((s) => s.homeTeam);
  const awayTeam = useBoardStore((s) => s.awayTeam);
  const homeFormation = useBoardStore((s) => s.homeFormation);
  const awayFormation = useBoardStore((s) => s.awayFormation);
  const setPlayerPositions = useBoardStore((s) => s.setPlayerPositions);
  const pushSnapshot = useBoardStore((s) => s.pushSnapshot);

  useKeyboardShortcuts();

  // When team or formation changes, recalculate player positions
  useEffect(() => {
    // Use a default layout for position calculation (will be re-mapped on canvas resize)
    const layout = calculatePitchLayout(900, 620);
    let positions: Record<string, { playerId: string; teamSide: "home" | "away"; x: number; y: number }> = {};

    if (homeTeam && homeFormation) {
      const starting = getStartingEleven(homeTeam.players);
      const homePositions = assignPlayersToFormation(
        starting,
        homeFormation,
        "home",
        layout
      );
      positions = { ...positions, ...homePositions };
    }

    if (awayTeam && awayFormation) {
      const starting = getStartingEleven(awayTeam.players);
      const awayPositions = assignPlayersToFormation(
        starting,
        awayFormation,
        "away",
        layout
      );
      positions = { ...positions, ...awayPositions };
    }

    setPlayerPositions(positions);
    pushSnapshot();
  }, [homeTeam, awayTeam, homeFormation, awayFormation, setPlayerPositions, pushSnapshot]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar: teams + formations + mode */}
      <div className="flex items-end gap-4 px-3 py-2 bg-surface border-b border-border flex-wrap shrink-0">
        <div className="flex items-end gap-2">
          <TeamSelector side="home" />
          <FormationSelector side="home" />
        </div>

        <div className="text-text-muted text-lg font-bold self-end pb-1">vs</div>

        <div className="flex items-end gap-2">
          <TeamSelector side="away" />
          <FormationSelector side="away" />
        </div>

        <div className="flex-1" />

        <div className="self-end pb-0.5">
          <ModeToggle />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: tools */}
        <div className="flex flex-col gap-3 px-2 py-3 bg-surface border-r border-border items-center shrink-0">
          <AnnotationTools />
          <div className="w-8 h-px bg-border" />
          <ColorPicker />
          <div className="w-8 h-px bg-border" />
          <StrokeWidthPicker />
        </div>

        {/* Canvas area */}
        {mode === "pitch" ? <PitchCanvas /> : <MediaCanvas />}
      </div>

      {/* Bottom bar: undo/redo + actions */}
      <div className="flex items-center gap-3 px-3 py-2 bg-surface border-t border-border shrink-0">
        <UndoRedoButtons />
        <div className="w-px h-6 bg-border" />
        <ActionButtons />
        <div className="flex-1" />
        <span className="text-[10px] text-text-muted">
          V:Select A:Arrow R:Rect C:Circle L:Line D:Draw T:Text | Ctrl+Z:Undo
        </span>
      </div>
    </div>
  );
}

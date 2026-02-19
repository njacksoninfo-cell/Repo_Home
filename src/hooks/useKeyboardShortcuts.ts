"use client";

import { useEffect } from "react";
import { useBoardStore } from "@/stores/boardStore";
import { exportToJSON, downloadJSON } from "@/lib/exportImport";
import type { ActiveTool } from "@/types/board";

const TOOL_SHORTCUTS: Record<string, ActiveTool> = {
  v: "select",
  a: "arrow",
  r: "rect",
  c: "circle",
  l: "line",
  d: "freehand",
  t: "text",
};

export function useKeyboardShortcuts() {
  const setActiveTool = useBoardStore((s) => s.setActiveTool);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && (e.key === "Z" || e.key === "y")) {
        e.preventDefault();
        redo();
        return;
      }

      // Export: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const state = useBoardStore.getState();
        const json = exportToJSON({
          mode: state.mode,
          homeTeamId: state.homeTeam?.id || null,
          awayTeamId: state.awayTeam?.id || null,
          homeFormationId: state.homeFormation?.id || null,
          awayFormationId: state.awayFormation?.id || null,
          playerPositions: state.playerPositions,
          ball: state.ball,
          annotations: state.annotations,
          uploadedImage: state.uploadedImage,
        });
        downloadJSON(json, `tactics-${new Date().toISOString().slice(0, 10)}.json`);
        return;
      }

      // Tool shortcuts (single key, no modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const tool = TOOL_SHORTCUTS[e.key.toLowerCase()];
        if (tool) {
          e.preventDefault();
          setActiveTool(tool);
          return;
        }

        // Escape: deselect tool → select mode
        if (e.key === "Escape") {
          setActiveTool("select");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveTool, undo, redo]);
}

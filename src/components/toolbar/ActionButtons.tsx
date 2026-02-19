"use client";

import { useCallback, useRef } from "react";
import { useBoardStore } from "@/stores/boardStore";
import { exportToJSON, downloadJSON, parseImportedJSON } from "@/lib/exportImport";

export default function ActionButtons() {
  const clearAnnotations = useBoardStore((s) => s.clearAnnotations);
  const resetPlayerPositions = useBoardStore((s) => s.resetPlayerPositions);
  const toggleBallVisibility = useBoardStore((s) => s.toggleBallVisibility);
  const ball = useBoardStore((s) => s.ball);
  const pushSnapshot = useBoardStore((s) => s.pushSnapshot);
  const importState = useBoardStore((s) => s.importState);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const store = useBoardStore.getState;

  const handleExport = useCallback(() => {
    const state = store();
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
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadJSON(json, `tactics-${timestamp}.json`);
  }, [store]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = parseImportedJSON(text);
        if (parsed) {
          importState({
            mode: parsed.mode,
            playerPositions: parsed.playerPositions,
            ball: parsed.ball,
            annotations: parsed.annotations,
            uploadedImage: parsed.uploadedImage || null,
          });
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be imported again
      e.target.value = "";
    },
    [importState]
  );

  const handleClearAnnotations = useCallback(() => {
    clearAnnotations();
    pushSnapshot();
  }, [clearAnnotations, pushSnapshot]);

  const handleResetPositions = useCallback(() => {
    resetPlayerPositions();
    pushSnapshot();
  }, [resetPlayerPositions, pushSnapshot]);

  const btnClass =
    "px-2 py-1.5 text-[11px] rounded bg-surface text-text-muted hover:bg-surface-light hover:text-foreground transition-colors border border-border";

  return (
    <div className="flex flex-wrap gap-1">
      <button onClick={toggleBallVisibility} className={btnClass} title="Toggle ball">
        {ball.visible ? "Hide Ball" : "Show Ball"}
      </button>
      <button onClick={handleClearAnnotations} className={btnClass} title="Clear all annotations">
        Clear Draw
      </button>
      <button onClick={handleResetPositions} className={btnClass} title="Reset player positions">
        Reset Pos
      </button>
      <div className="w-px bg-border mx-1" />
      <button onClick={handleExport} className={btnClass} title="Export board state (Ctrl+S)">
        Export
      </button>
      <button onClick={handleImport} className={btnClass} title="Import board state">
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

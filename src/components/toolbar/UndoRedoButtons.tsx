"use client";

import { useBoardStore } from "@/stores/boardStore";
import { cn } from "@/utils/cn";

export default function UndoRedoButtons() {
  const historyIndex = useBoardStore((s) => s.historyIndex);
  const historyLength = useBoardStore((s) => s.history.length);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  return (
    <div className="flex gap-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded text-sm transition-colors",
          canUndo
            ? "bg-surface text-foreground hover:bg-surface-light"
            : "bg-surface text-text-muted opacity-40 cursor-not-allowed"
        )}
      >
        &#x21B6;
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded text-sm transition-colors",
          canRedo
            ? "bg-surface text-foreground hover:bg-surface-light"
            : "bg-surface text-text-muted opacity-40 cursor-not-allowed"
        )}
      >
        &#x21B7;
      </button>
    </div>
  );
}

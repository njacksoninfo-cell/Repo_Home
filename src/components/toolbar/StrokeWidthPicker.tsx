"use client";

import { useBoardStore } from "@/stores/boardStore";
import { STROKE_WIDTHS } from "@/lib/colors";
import { cn } from "@/utils/cn";

export default function StrokeWidthPicker() {
  const toolStrokeWidth = useBoardStore((s) => s.toolStrokeWidth);
  const setToolStrokeWidth = useBoardStore((s) => s.setToolStrokeWidth);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-text-muted uppercase tracking-wider text-center">
        Width
      </span>
      <div className="flex flex-col items-center gap-1">
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => setToolStrokeWidth(w)}
            title={`${w}px`}
            className={cn(
              "w-8 h-6 flex items-center justify-center rounded transition-colors",
              toolStrokeWidth === w
                ? "bg-accent"
                : "bg-surface hover:bg-surface-light"
            )}
          >
            <div
              className="bg-foreground rounded-full"
              style={{ width: 16, height: Math.max(w, 1) }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

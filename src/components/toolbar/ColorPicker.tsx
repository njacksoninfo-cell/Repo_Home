"use client";

import { useBoardStore } from "@/stores/boardStore";
import { ANNOTATION_COLORS } from "@/lib/colors";
import { cn } from "@/utils/cn";

export default function ColorPicker() {
  const toolColor = useBoardStore((s) => s.toolColor);
  const setToolColor = useBoardStore((s) => s.setToolColor);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-text-muted uppercase tracking-wider text-center">
        Color
      </span>
      <div className="grid grid-cols-2 gap-1">
        {ANNOTATION_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setToolColor(color)}
            className={cn(
              "w-4 h-4 rounded-sm border transition-transform",
              toolColor === color
                ? "border-white scale-125"
                : "border-transparent hover:scale-110"
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}

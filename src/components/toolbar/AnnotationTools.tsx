"use client";

import { useBoardStore } from "@/stores/boardStore";
import type { ActiveTool } from "@/types/board";
import { cn } from "@/utils/cn";

const tools: { id: ActiveTool; label: string; icon: string; shortcut: string }[] = [
  { id: "select", label: "Select", icon: "V", shortcut: "V" },
  { id: "arrow", label: "Arrow", icon: "\u2197", shortcut: "A" },
  { id: "rect", label: "Rectangle", icon: "\u25A1", shortcut: "R" },
  { id: "circle", label: "Circle", icon: "\u25CB", shortcut: "C" },
  { id: "line", label: "Line", icon: "\u2215", shortcut: "L" },
  { id: "freehand", label: "Free Draw", icon: "\u270E", shortcut: "D" },
  { id: "text", label: "Text", icon: "T", shortcut: "T" },
];

export default function AnnotationTools() {
  const activeTool = useBoardStore((s) => s.activeTool);
  const setActiveTool = useBoardStore((s) => s.setActiveTool);

  return (
    <div className="flex flex-col gap-1">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded text-lg transition-colors",
            activeTool === tool.id
              ? "bg-accent text-white shadow-lg"
              : "bg-surface text-text-muted hover:bg-surface-light hover:text-foreground"
          )}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

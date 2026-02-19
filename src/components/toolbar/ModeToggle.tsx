"use client";

import { useBoardStore } from "@/stores/boardStore";
import type { AppMode } from "@/types/board";
import { cn } from "@/utils/cn";

export default function ModeToggle() {
  const mode = useBoardStore((s) => s.mode);
  const setMode = useBoardStore((s) => s.setMode);

  const modes: { value: AppMode; label: string }[] = [
    { value: "pitch", label: "Pitch" },
    { value: "media", label: "Media" },
  ];

  return (
    <div className="flex bg-surface rounded overflow-hidden border border-border">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            mode === m.value
              ? "bg-accent text-white"
              : "text-text-muted hover:text-foreground"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

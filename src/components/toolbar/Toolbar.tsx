"use client";

import TeamSelector from "./TeamSelector";
import FormationSelector from "./FormationSelector";
import ModeToggle from "./ModeToggle";
import AnnotationTools from "./AnnotationTools";
import ColorPicker from "./ColorPicker";
import StrokeWidthPicker from "./StrokeWidthPicker";
import UndoRedoButtons from "./UndoRedoButtons";
import ActionButtons from "./ActionButtons";

export default function Toolbar() {
  return (
    <div className="flex flex-col h-full">
      {/* Top bar: teams + formations + mode */}
      <div className="flex items-end gap-4 px-3 py-2 bg-surface border-b border-border flex-wrap">
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

        <ModeToggle />
      </div>

      {/* Main content area with left sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: tools */}
        <div className="flex flex-col gap-3 px-2 py-3 bg-surface border-r border-border items-center">
          <AnnotationTools />
          <div className="w-8 h-px bg-border" />
          <ColorPicker />
          <div className="w-8 h-px bg-border" />
          <StrokeWidthPicker />
        </div>

        {/* Canvas slot - children go here */}
        <div className="flex-1 flex flex-col overflow-hidden" id="canvas-container">
          {/* Injected by TacticsBoard */}
        </div>
      </div>

      {/* Bottom bar: undo/redo + actions */}
      <div className="flex items-center gap-3 px-3 py-2 bg-surface border-t border-border">
        <UndoRedoButtons />
        <div className="w-px h-6 bg-border" />
        <ActionButtons />
      </div>
    </div>
  );
}

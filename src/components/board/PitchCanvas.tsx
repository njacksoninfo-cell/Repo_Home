"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import PitchLayer from "./PitchLayer";
import PlayersLayer from "./PlayersLayer";
import {
  useAnnotationHandlers,
  AnnotationRenderer,
} from "./AnnotationLayer";
import { calculatePitchLayout } from "@/lib/pitchDimensions";
import { useBoardStore } from "@/stores/boardStore";
import type { KonvaEventObject } from "konva/lib/Node";

export default function PitchCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 620 });
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const activeTool = useBoardStore((s) => s.activeTool);
  const layout = calculatePitchLayout(dimensions.width, dimensions.height);

  const {
    annotations,
    currentDrawing,
    textInput,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    submitText,
  } = useAnnotationHandlers();

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(container);
    // Initial size
    setDimensions({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    return () => observer.disconnect();
  }, []);

  const handleTooltip = useCallback(
    (text: string | null, x: number, y: number) => {
      if (text) {
        setTooltip({ text, x, y });
      } else {
        setTooltip(null);
      }
    },
    []
  );

  const handleStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      handleMouseDown(e);
    },
    [handleMouseDown]
  );

  const handleStageMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      handleMouseMove(e);
    },
    [handleMouseMove]
  );

  const handleStageMouseUp = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const cursorStyle =
    activeTool === "select" ? "default" : "crosshair";

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{ cursor: cursorStyle }}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown as unknown as (e: KonvaEventObject<TouchEvent>) => void}
        onTouchMove={handleStageMouseMove as unknown as (e: KonvaEventObject<TouchEvent>) => void}
        onTouchEnd={handleStageMouseUp}
      >
        {/* Layer 1: Static pitch markings */}
        <Layer listening={false}>
          <PitchLayer layout={layout} />
        </Layer>

        {/* Layer 2: Interactive players */}
        <Layer>
          <PlayersLayer layout={layout} onTooltip={handleTooltip} />
        </Layer>

        {/* Layer 3: Annotations */}
        <Layer>
          <AnnotationRenderer
            annotations={annotations}
            currentDrawing={currentDrawing}
          />
        </Layer>
      </Stage>

      {/* Tooltip overlay */}
      {tooltip && (
        <div
          className="player-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Text input overlay */}
      {textInput && (
        <TextInputOverlay
          x={textInput.x + (containerRef.current?.getBoundingClientRect().left || 0) - (containerRef.current?.getBoundingClientRect().left || 0)}
          y={textInput.y}
          onSubmit={submitText}
        />
      )}
    </div>
  );
}

function TextInputOverlay({
  x,
  y,
  onSubmit,
}: {
  x: number;
  y: number;
  onSubmit: (text: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSubmit(value);
    } else if (e.key === "Escape") {
      onSubmit("");
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSubmit(value)}
      className="absolute bg-surface border border-border text-foreground px-2 py-1 text-sm rounded outline-none focus:border-accent"
      style={{ left: x, top: y, minWidth: 100 }}
      placeholder="Type text..."
    />
  );
}

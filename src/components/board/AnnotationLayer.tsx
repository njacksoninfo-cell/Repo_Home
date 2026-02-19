"use client";

import { Fragment, useState, useCallback, useRef } from "react";
import { Arrow, Rect, Circle, Line, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useBoardStore } from "@/stores/boardStore";
import type { Annotation } from "@/types/annotation";
import {
  createAnnotation,
  updateAnnotationDuringDraw,
} from "@/lib/annotationFactory";

interface AnnotationLayerProps {
  onStageMouseDown: (handler: (e: KonvaEventObject<MouseEvent>) => void) => void;
  onStageMouseMove: (handler: (e: KonvaEventObject<MouseEvent>) => void) => void;
  onStageMouseUp: (handler: () => void) => void;
}

export function useAnnotationHandlers() {
  const annotations = useBoardStore((s) => s.annotations);
  const activeTool = useBoardStore((s) => s.activeTool);
  const toolColor = useBoardStore((s) => s.toolColor);
  const toolStrokeWidth = useBoardStore((s) => s.toolStrokeWidth);
  const addAnnotation = useBoardStore((s) => s.addAnnotation);
  const pushSnapshot = useBoardStore((s) => s.pushSnapshot);

  const [currentDrawing, setCurrentDrawing] = useState<Annotation | null>(null);
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    stageX: number;
    stageY: number;
  } | null>(null);
  const isDrawing = useRef(false);

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (activeTool === "select") return;

      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      if (activeTool === "text") {
        setTextInput({
          x: pos.x,
          y: pos.y,
          stageX: stage.container().getBoundingClientRect().left,
          stageY: stage.container().getBoundingClientRect().top,
        });
        return;
      }

      isDrawing.current = true;
      const annotation = createAnnotation(
        activeTool,
        pos.x,
        pos.y,
        toolColor,
        toolStrokeWidth
      );
      setCurrentDrawing(annotation);
    },
    [activeTool, toolColor, toolStrokeWidth]
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!isDrawing.current || !currentDrawing) return;

      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const updated = updateAnnotationDuringDraw(
        currentDrawing,
        pos.x,
        pos.y
      );
      setCurrentDrawing(updated);
    },
    [currentDrawing]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current || !currentDrawing) return;
    isDrawing.current = false;

    // Only add if the annotation has some meaningful size
    let shouldAdd = true;
    if (currentDrawing.type === "arrow" || currentDrawing.type === "line") {
      const [x1, y1, x2, y2] = currentDrawing.points;
      const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      if (dist < 5) shouldAdd = false;
    } else if (currentDrawing.type === "rect") {
      if (
        Math.abs(currentDrawing.width) < 5 &&
        Math.abs(currentDrawing.height) < 5
      )
        shouldAdd = false;
    } else if (currentDrawing.type === "circle") {
      if (currentDrawing.radius < 3) shouldAdd = false;
    }

    if (shouldAdd) {
      addAnnotation(currentDrawing);
      pushSnapshot();
    }
    setCurrentDrawing(null);
  }, [currentDrawing, addAnnotation, pushSnapshot]);

  const submitText = useCallback(
    (text: string) => {
      if (!textInput || !text.trim()) {
        setTextInput(null);
        return;
      }
      const annotation = createAnnotation(
        "text",
        textInput.x,
        textInput.y,
        toolColor,
        toolStrokeWidth
      );
      if (annotation.type === "text") {
        annotation.text = text;
      }
      addAnnotation(annotation);
      pushSnapshot();
      setTextInput(null);
    },
    [textInput, toolColor, toolStrokeWidth, addAnnotation, pushSnapshot]
  );

  return {
    annotations,
    currentDrawing,
    textInput,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    submitText,
  };
}

function renderAnnotation(ann: Annotation, key?: string) {
  const k = key || ann.id;
  switch (ann.type) {
    case "arrow":
      return (
        <Arrow
          key={k}
          points={ann.points}
          stroke={ann.color}
          strokeWidth={ann.strokeWidth}
          pointerLength={ann.pointerLength}
          pointerWidth={ann.pointerWidth}
          opacity={ann.opacity}
          fill={ann.color}
          lineCap="round"
          lineJoin="round"
        />
      );
    case "rect":
      return (
        <Rect
          key={k}
          x={ann.x}
          y={ann.y}
          width={ann.width}
          height={ann.height}
          stroke={ann.color}
          strokeWidth={ann.strokeWidth}
          opacity={ann.opacity}
          fill={ann.fill}
        />
      );
    case "circle":
      return (
        <Circle
          key={k}
          x={ann.x}
          y={ann.y}
          radius={ann.radius}
          stroke={ann.color}
          strokeWidth={ann.strokeWidth}
          opacity={ann.opacity}
          fill={ann.fill}
        />
      );
    case "line":
      return (
        <Line
          key={k}
          points={ann.points}
          stroke={ann.color}
          strokeWidth={ann.strokeWidth}
          opacity={ann.opacity}
          lineCap="round"
        />
      );
    case "freehand":
      return (
        <Line
          key={k}
          points={ann.points}
          stroke={ann.color}
          strokeWidth={ann.strokeWidth}
          opacity={ann.opacity}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
        />
      );
    case "text":
      return (
        <Text
          key={k}
          x={ann.x}
          y={ann.y}
          text={ann.text}
          fontSize={ann.fontSize}
          fill={ann.color}
          opacity={ann.opacity}
          fontStyle="bold"
        />
      );
  }
}

export function AnnotationRenderer({
  annotations,
  currentDrawing,
}: {
  annotations: Annotation[];
  currentDrawing: Annotation | null;
}) {
  return (
    <Fragment>
      {annotations.map((ann) => renderAnnotation(ann))}
      {currentDrawing && renderAnnotation(currentDrawing, "current-drawing")}
    </Fragment>
  );
}

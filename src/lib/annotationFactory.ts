import type { Annotation, AnnotationType } from "@/types/annotation";
import { generateId } from "@/utils/id";

export function createAnnotation(
  type: AnnotationType,
  startX: number,
  startY: number,
  color: string,
  strokeWidth: number
): Annotation {
  const id = generateId();
  const base = { id, color, strokeWidth, opacity: 1 };

  switch (type) {
    case "arrow":
      return {
        ...base,
        type: "arrow",
        points: [startX, startY, startX, startY],
        pointerLength: 14,
        pointerWidth: 12,
      };
    case "rect":
      return {
        ...base,
        type: "rect",
        x: startX,
        y: startY,
        width: 0,
        height: 0,
      };
    case "circle":
      return {
        ...base,
        type: "circle",
        x: startX,
        y: startY,
        radius: 0,
      };
    case "line":
      return {
        ...base,
        type: "line",
        points: [startX, startY, startX, startY],
      };
    case "freehand":
      return {
        ...base,
        type: "freehand",
        points: [startX, startY],
      };
    case "text":
      return {
        ...base,
        type: "text",
        x: startX,
        y: startY,
        text: "Text",
        fontSize: 18,
      };
  }
}

export function updateAnnotationDuringDraw(
  annotation: Annotation,
  currentX: number,
  currentY: number
): Annotation {
  switch (annotation.type) {
    case "arrow":
      return {
        ...annotation,
        points: [annotation.points[0], annotation.points[1], currentX, currentY],
      };
    case "line":
      return {
        ...annotation,
        points: [annotation.points[0], annotation.points[1], currentX, currentY],
      };
    case "rect":
      return {
        ...annotation,
        width: currentX - annotation.x,
        height: currentY - annotation.y,
      };
    case "circle": {
      const dx = currentX - annotation.x;
      const dy = currentY - annotation.y;
      return { ...annotation, radius: Math.sqrt(dx * dx + dy * dy) };
    }
    case "freehand":
      return {
        ...annotation,
        points: [...annotation.points, currentX, currentY],
      };
    case "text":
      return annotation;
  }
}

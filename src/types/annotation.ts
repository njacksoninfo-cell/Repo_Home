export type AnnotationType = "arrow" | "rect" | "circle" | "line" | "freehand" | "text";

interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: "arrow";
  points: [number, number, number, number];
  pointerLength: number;
  pointerWidth: number;
}

export interface RectAnnotation extends BaseAnnotation {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: "circle";
  x: number;
  y: number;
  radius: number;
  fill?: string;
}

export interface LineAnnotation extends BaseAnnotation {
  type: "line";
  points: [number, number, number, number];
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: "freehand";
  points: number[];
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type Annotation =
  | ArrowAnnotation
  | RectAnnotation
  | CircleAnnotation
  | LineAnnotation
  | FreehandAnnotation
  | TextAnnotation;

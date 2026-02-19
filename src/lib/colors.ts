// Annotation color palette
export const ANNOTATION_COLORS = [
  "#FF0000", // Red
  "#FF6600", // Orange
  "#FFFF00", // Yellow
  "#00FF00", // Green
  "#00CCFF", // Cyan
  "#0066FF", // Blue
  "#9933FF", // Purple
  "#FF00FF", // Magenta
  "#FFFFFF", // White
  "#000000", // Black
] as const;

export const DEFAULT_ANNOTATION_COLOR = "#FF0000";
export const DEFAULT_STROKE_WIDTH = 3;

export const STROKE_WIDTHS = [1, 2, 3, 5, 8] as const;

// Pitch colors
export const PITCH_COLORS = {
  grass: "#1b5e20",
  grassLight: "#2e7d32",
  lines: "#ffffff",
  lineWidth: 2,
  goalNet: "#cccccc",
} as const;

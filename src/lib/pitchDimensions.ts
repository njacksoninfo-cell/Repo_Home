// FIFA standard pitch proportions (105m x 68m)
export const PITCH = {
  LENGTH: 105,
  WIDTH: 68,
  ASPECT_RATIO: 105 / 68,

  // Center circle
  CENTER_CIRCLE_RADIUS: 9.15,

  // Penalty area
  PENALTY_AREA_WIDTH: 40.32,
  PENALTY_AREA_DEPTH: 16.5,

  // Goal area (6-yard box)
  GOAL_AREA_WIDTH: 18.32,
  GOAL_AREA_DEPTH: 5.5,

  // Penalty spot
  PENALTY_SPOT_DISTANCE: 11,

  // Penalty arc radius
  PENALTY_ARC_RADIUS: 9.15,

  // Goal
  GOAL_WIDTH: 7.32,
  GOAL_DEPTH: 2.44,

  // Corner arc
  CORNER_ARC_RADIUS: 1,

  // Margin as fraction of canvas
  MARGIN_FRACTION: 0.04,
} as const;

export interface PitchLayout {
  canvasWidth: number;
  canvasHeight: number;
  marginX: number;
  marginY: number;
  pitchX: number;
  pitchY: number;
  pitchWidth: number;
  pitchHeight: number;
  scale: number; // pixels per meter
}

export function calculatePitchLayout(
  containerWidth: number,
  containerHeight: number
): PitchLayout {
  const marginX = containerWidth * PITCH.MARGIN_FRACTION;
  const marginY = containerHeight * PITCH.MARGIN_FRACTION;
  const availableWidth = containerWidth - 2 * marginX;
  const availableHeight = containerHeight - 2 * marginY;

  let pitchWidth: number;
  let pitchHeight: number;

  if (availableWidth / availableHeight > PITCH.ASPECT_RATIO) {
    // Container is wider than pitch — constrain by height
    pitchHeight = availableHeight;
    pitchWidth = pitchHeight * PITCH.ASPECT_RATIO;
  } else {
    // Container is taller than pitch — constrain by width
    pitchWidth = availableWidth;
    pitchHeight = pitchWidth / PITCH.ASPECT_RATIO;
  }

  const pitchX = (containerWidth - pitchWidth) / 2;
  const pitchY = (containerHeight - pitchHeight) / 2;
  const scale = pitchWidth / PITCH.LENGTH;

  return {
    canvasWidth: containerWidth,
    canvasHeight: containerHeight,
    marginX,
    marginY,
    pitchX,
    pitchY,
    pitchWidth,
    pitchHeight,
    scale,
  };
}

// Convert percentage coordinates (0-100) to canvas pixel coordinates
export function percentToCanvas(
  pctX: number,
  pctY: number,
  layout: PitchLayout
): { x: number; y: number } {
  return {
    x: layout.pitchX + (pctX / 100) * layout.pitchWidth,
    y: layout.pitchY + (pctY / 100) * layout.pitchHeight,
  };
}

// Convert canvas pixel coordinates to percentage coordinates (0-100)
export function canvasToPercent(
  canvasX: number,
  canvasY: number,
  layout: PitchLayout
): { x: number; y: number } {
  return {
    x: ((canvasX - layout.pitchX) / layout.pitchWidth) * 100,
    y: ((canvasY - layout.pitchY) / layout.pitchHeight) * 100,
  };
}

// Convert meters to canvas pixels
export function metersToPixels(meters: number, layout: PitchLayout): number {
  return meters * layout.scale;
}

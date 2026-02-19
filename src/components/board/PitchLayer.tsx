"use client";

import { Rect, Line, Circle, Arc, Group } from "react-konva";
import type { PitchLayout } from "@/lib/pitchDimensions";
import { PITCH, metersToPixels } from "@/lib/pitchDimensions";
import { PITCH_COLORS } from "@/lib/colors";

interface PitchLayerProps {
  layout: PitchLayout;
}

export default function PitchLayer({ layout }: PitchLayerProps) {
  const { pitchX, pitchY, pitchWidth, pitchHeight } = layout;
  const m = (meters: number) => metersToPixels(meters, layout);
  const lw = PITCH_COLORS.lineWidth;
  const lineColor = PITCH_COLORS.lines;

  const centerX = pitchX + pitchWidth / 2;
  const centerY = pitchY + pitchHeight / 2;

  // Penalty area dimensions in pixels
  const penaltyW = m(PITCH.PENALTY_AREA_WIDTH);
  const penaltyD = m(PITCH.PENALTY_AREA_DEPTH);
  const goalAreaW = m(PITCH.GOAL_AREA_WIDTH);
  const goalAreaD = m(PITCH.GOAL_AREA_DEPTH);
  const goalW = m(PITCH.GOAL_WIDTH);
  const goalD = m(PITCH.GOAL_DEPTH);

  return (
    <Group listening={false}>
      {/* Background - full canvas dark */}
      <Rect
        x={0}
        y={0}
        width={layout.canvasWidth}
        height={layout.canvasHeight}
        fill="#0a0f0a"
      />

      {/* Pitch grass */}
      <Rect
        x={pitchX}
        y={pitchY}
        width={pitchWidth}
        height={pitchHeight}
        fill={PITCH_COLORS.grass}
        cornerRadius={4}
      />

      {/* Grass stripes (subtle) */}
      {Array.from({ length: 10 }, (_, i) => (
        <Rect
          key={`stripe-${i}`}
          x={pitchX}
          y={pitchY + (i * pitchHeight) / 10}
          width={pitchWidth}
          height={pitchHeight / 10}
          fill={i % 2 === 0 ? PITCH_COLORS.grass : PITCH_COLORS.grassLight}
          opacity={i % 2 === 0 ? 1 : 0.15}
        />
      ))}

      {/* Outer boundary */}
      <Rect
        x={pitchX}
        y={pitchY}
        width={pitchWidth}
        height={pitchHeight}
        stroke={lineColor}
        strokeWidth={lw}
        cornerRadius={2}
      />

      {/* Halfway line */}
      <Line
        points={[pitchX, centerY, pitchX + pitchWidth, centerY]}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Center circle */}
      <Circle
        x={centerX}
        y={centerY}
        radius={m(PITCH.CENTER_CIRCLE_RADIUS)}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Center spot */}
      <Circle x={centerX} y={centerY} radius={3} fill={lineColor} />

      {/* === TOP HALF (home goal) === */}

      {/* Top penalty area */}
      <Rect
        x={centerX - penaltyW / 2}
        y={pitchY}
        width={penaltyW}
        height={penaltyD}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Top goal area (6-yard box) */}
      <Rect
        x={centerX - goalAreaW / 2}
        y={pitchY}
        width={goalAreaW}
        height={goalAreaD}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Top penalty spot */}
      <Circle
        x={centerX}
        y={pitchY + m(PITCH.PENALTY_SPOT_DISTANCE)}
        radius={3}
        fill={lineColor}
      />

      {/* Top penalty arc */}
      <Arc
        x={centerX}
        y={pitchY + m(PITCH.PENALTY_SPOT_DISTANCE)}
        innerRadius={m(PITCH.PENALTY_ARC_RADIUS)}
        outerRadius={m(PITCH.PENALTY_ARC_RADIUS)}
        angle={130}
        rotation={115}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Top goal */}
      <Rect
        x={centerX - goalW / 2}
        y={pitchY - goalD}
        width={goalW}
        height={goalD}
        stroke={PITCH_COLORS.goalNet}
        strokeWidth={1}
        fill="rgba(200,200,200,0.1)"
      />

      {/* Top-left corner arc */}
      <Arc
        x={pitchX}
        y={pitchY}
        innerRadius={m(PITCH.CORNER_ARC_RADIUS)}
        outerRadius={m(PITCH.CORNER_ARC_RADIUS)}
        angle={90}
        rotation={0}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Top-right corner arc */}
      <Arc
        x={pitchX + pitchWidth}
        y={pitchY}
        innerRadius={m(PITCH.CORNER_ARC_RADIUS)}
        outerRadius={m(PITCH.CORNER_ARC_RADIUS)}
        angle={90}
        rotation={90}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* === BOTTOM HALF (away goal) === */}

      {/* Bottom penalty area */}
      <Rect
        x={centerX - penaltyW / 2}
        y={pitchY + pitchHeight - penaltyD}
        width={penaltyW}
        height={penaltyD}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Bottom goal area (6-yard box) */}
      <Rect
        x={centerX - goalAreaW / 2}
        y={pitchY + pitchHeight - goalAreaD}
        width={goalAreaW}
        height={goalAreaD}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Bottom penalty spot */}
      <Circle
        x={centerX}
        y={pitchY + pitchHeight - m(PITCH.PENALTY_SPOT_DISTANCE)}
        radius={3}
        fill={lineColor}
      />

      {/* Bottom penalty arc */}
      <Arc
        x={centerX}
        y={pitchY + pitchHeight - m(PITCH.PENALTY_SPOT_DISTANCE)}
        innerRadius={m(PITCH.PENALTY_ARC_RADIUS)}
        outerRadius={m(PITCH.PENALTY_ARC_RADIUS)}
        angle={130}
        rotation={295}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Bottom goal */}
      <Rect
        x={centerX - goalW / 2}
        y={pitchY + pitchHeight}
        width={goalW}
        height={goalD}
        stroke={PITCH_COLORS.goalNet}
        strokeWidth={1}
        fill="rgba(200,200,200,0.1)"
      />

      {/* Bottom-left corner arc */}
      <Arc
        x={pitchX}
        y={pitchY + pitchHeight}
        innerRadius={m(PITCH.CORNER_ARC_RADIUS)}
        outerRadius={m(PITCH.CORNER_ARC_RADIUS)}
        angle={90}
        rotation={270}
        stroke={lineColor}
        strokeWidth={lw}
      />

      {/* Bottom-right corner arc */}
      <Arc
        x={pitchX + pitchWidth}
        y={pitchY + pitchHeight}
        innerRadius={m(PITCH.CORNER_ARC_RADIUS)}
        outerRadius={m(PITCH.CORNER_ARC_RADIUS)}
        angle={90}
        rotation={180}
        stroke={lineColor}
        strokeWidth={lw}
      />
    </Group>
  );
}

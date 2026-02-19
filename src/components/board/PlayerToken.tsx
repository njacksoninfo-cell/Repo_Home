"use client";

import { Group, Circle, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

interface PlayerTokenProps {
  x: number;
  y: number;
  number: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  teamSide: "home" | "away";
  radius?: number;
  onDragStart?: () => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
  onMouseEnter?: (e: KonvaEventObject<MouseEvent>) => void;
  onMouseLeave?: () => void;
  draggable?: boolean;
}

export default function PlayerToken({
  x,
  y,
  number,
  primaryColor,
  secondaryColor,
  radius = 18,
  onDragStart,
  onDragMove,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  draggable = true,
}: PlayerTokenProps) {
  const fontSize = radius * 0.85;

  return (
    <Group
      x={x}
      y={y}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Shadow */}
      <Circle
        x={1}
        y={2}
        radius={radius}
        fill="rgba(0,0,0,0.4)"
      />
      {/* Outer ring */}
      <Circle
        radius={radius}
        fill={primaryColor}
        stroke={secondaryColor}
        strokeWidth={2}
      />
      {/* Jersey number */}
      <Text
        text={String(number)}
        fontSize={fontSize}
        fontStyle="bold"
        fill={secondaryColor}
        align="center"
        verticalAlign="middle"
        width={radius * 2}
        height={radius * 2}
        offsetX={radius}
        offsetY={radius}
      />
    </Group>
  );
}

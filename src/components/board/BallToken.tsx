"use client";

import { Group, Circle } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";

interface BallTokenProps {
  x: number;
  y: number;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
  draggable?: boolean;
}

export default function BallToken({
  x,
  y,
  onDragEnd,
  draggable = true,
}: BallTokenProps) {
  return (
    <Group x={x} y={y} draggable={draggable} onDragEnd={onDragEnd}>
      {/* Shadow */}
      <Circle x={1} y={2} radius={10} fill="rgba(0,0,0,0.3)" />
      {/* Ball */}
      <Circle radius={10} fill="#ffffff" stroke="#333333" strokeWidth={1.5} />
      {/* Pentagon pattern */}
      <Circle radius={4} fill="#333333" />
    </Group>
  );
}

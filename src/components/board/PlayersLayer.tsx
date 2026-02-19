"use client";

import { Fragment, useCallback, useState } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import { useBoardStore } from "@/stores/boardStore";
import PlayerToken from "./PlayerToken";
import BallToken from "./BallToken";
import type { PitchLayout } from "@/lib/pitchDimensions";

interface PlayersLayerProps {
  layout: PitchLayout;
  onTooltip: (text: string | null, x: number, y: number) => void;
}

export default function PlayersLayer({ layout, onTooltip }: PlayersLayerProps) {
  const playerPositions = useBoardStore((s) => s.playerPositions);
  const homeTeam = useBoardStore((s) => s.homeTeam);
  const awayTeam = useBoardStore((s) => s.awayTeam);
  const ball = useBoardStore((s) => s.ball);
  const activeTool = useBoardStore((s) => s.activeTool);
  const updatePlayerPosition = useBoardStore((s) => s.updatePlayerPosition);
  const updateBallPosition = useBoardStore((s) => s.updateBallPosition);
  const pushSnapshot = useBoardStore((s) => s.pushSnapshot);

  const [, setDragging] = useState(false);

  const isSelecting = activeTool === "select";

  // Find player data from teams
  const getPlayerInfo = useCallback(
    (playerId: string) => {
      if (homeTeam) {
        const p = homeTeam.players.find((pl) => pl.id === playerId);
        if (p) return { player: p, team: homeTeam, side: "home" as const };
      }
      if (awayTeam) {
        const p = awayTeam.players.find((pl) => pl.id === playerId);
        if (p) return { player: p, team: awayTeam, side: "away" as const };
      }
      return null;
    },
    [homeTeam, awayTeam]
  );

  const handleDragStart = useCallback(() => {
    setDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (playerId: string, e: KonvaEventObject<DragEvent>) => {
      const node = e.target;
      updatePlayerPosition(playerId, node.x(), node.y());
      pushSnapshot();
      setDragging(false);
    },
    [updatePlayerPosition, pushSnapshot]
  );

  const handleBallDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      const node = e.target;
      updateBallPosition(node.x(), node.y());
      pushSnapshot();
    },
    [updateBallPosition, pushSnapshot]
  );

  const handleMouseEnter = useCallback(
    (name: string, e: KonvaEventObject<MouseEvent>) => {
      const node = e.target;
      const stage = node.getStage();
      if (stage) {
        const pos = node.getAbsolutePosition();
        onTooltip(name, pos.x, pos.y - 22);
      }
    },
    [onTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    onTooltip(null, 0, 0);
  }, [onTooltip]);

  return (
    <Fragment>
      {Object.values(playerPositions).map((pp) => {
        const info = getPlayerInfo(pp.playerId);
        if (!info) return null;
        const { player, team } = info;

        return (
          <PlayerToken
            key={pp.playerId}
            x={pp.x}
            y={pp.y}
            number={player.number}
            name={player.name}
            primaryColor={team.colors.primary}
            secondaryColor={team.colors.secondary}
            teamSide={pp.teamSide}
            draggable={isSelecting}
            onDragStart={handleDragStart}
            onDragEnd={(e) => handleDragEnd(pp.playerId, e)}
            onMouseEnter={(e) => handleMouseEnter(player.name, e)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}

      {ball.visible && (
        <BallToken
          x={ball.x || layout.pitchX + layout.pitchWidth / 2}
          y={ball.y || layout.pitchY + layout.pitchHeight / 2}
          draggable={isSelecting}
          onDragEnd={handleBallDragEnd}
        />
      )}
    </Fragment>
  );
}

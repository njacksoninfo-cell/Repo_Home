import type { Player } from "@/types/team";
import type { Formation, FormationSlot } from "@/types/formation";
import type { PositionedPlayer } from "@/types/board";
import type { PitchLayout } from "./pitchDimensions";
import { percentToCanvas } from "./pitchDimensions";

// Position compatibility map: which player positions can fill which formation slots
const POSITION_COMPAT: Record<string, string[]> = {
  GK: ["GK"],
  RB: ["RB", "RWB"],
  LB: ["LB", "LWB"],
  RWB: ["RWB", "RB", "RM"],
  LWB: ["LWB", "LB", "LM"],
  RCB: ["CB", "RB"],
  LCB: ["CB", "LB"],
  CB: ["CB"],
  CDM: ["CDM", "CM"],
  RCM: ["CM", "CDM", "CAM", "RM"],
  LCM: ["CM", "CDM", "CAM", "LM"],
  CM: ["CM", "CDM", "CAM"],
  CAM: ["CAM", "CM", "CF"],
  RM: ["RM", "RW", "RB"],
  LM: ["LM", "LW", "LB"],
  RW: ["RW", "RM", "ST", "CF"],
  LW: ["LW", "LM", "ST", "CF"],
  ST: ["ST", "CF", "CAM"],
  RCF: ["ST", "CF", "RW"],
  LCF: ["ST", "CF", "LW"],
  CF: ["CF", "ST", "CAM"],
};

function getCompatiblePositions(slotLabel: string): string[] {
  return POSITION_COMPAT[slotLabel] || [slotLabel];
}

export function assignPlayersToFormation(
  players: Player[],
  formation: Formation,
  teamSide: "home" | "away",
  layout: PitchLayout
): Record<string, PositionedPlayer> {
  const result: Record<string, PositionedPlayer> = {};
  const assignedPlayerIds = new Set<string>();
  const slots = [...formation.slots];

  // Sort slots: GK first, then defenders, midfielders, attackers
  // This ensures GK gets assigned first before outfield players
  const positionPriority: Record<string, number> = {
    GK: 0,
    RB: 1, RCB: 1, LCB: 1, LB: 1, CB: 1, RWB: 1, LWB: 1,
    CDM: 2, RCM: 2, LCM: 2, CM: 2, RM: 2, LM: 2,
    CAM: 3, RW: 3, LW: 3,
    ST: 4, RCF: 4, LCF: 4, CF: 4,
  };

  const sortedSlots = slots.sort(
    (a, b) => (positionPriority[a.label] ?? 5) - (positionPriority[b.label] ?? 5)
  );

  // First pass: assign by best match
  for (const slot of sortedSlots) {
    const compatPositions = getCompatiblePositions(slot.label);
    let bestPlayer: Player | null = null;

    for (const compatPos of compatPositions) {
      const candidate = players.find(
        (p) => p.position === compatPos && !assignedPlayerIds.has(p.id)
      );
      if (candidate) {
        bestPlayer = candidate;
        break;
      }
    }

    if (bestPlayer) {
      assignedPlayerIds.add(bestPlayer.id);
      const pos = slotToCanvasPosition(slot, teamSide, layout);
      result[bestPlayer.id] = {
        playerId: bestPlayer.id,
        teamSide,
        x: pos.x,
        y: pos.y,
      };
    }
  }

  // Second pass: fill remaining slots with any unassigned player
  for (const slot of sortedSlots) {
    const hasAssignment = Object.values(result).some((p) => {
      const slotPos = slotToCanvasPosition(slot, teamSide, layout);
      return Math.abs(p.x - slotPos.x) < 1 && Math.abs(p.y - slotPos.y) < 1;
    });

    if (!hasAssignment) {
      const unassigned = players.find((p) => !assignedPlayerIds.has(p.id));
      if (unassigned) {
        assignedPlayerIds.add(unassigned.id);
        const pos = slotToCanvasPosition(slot, teamSide, layout);
        result[unassigned.id] = {
          playerId: unassigned.id,
          teamSide,
          x: pos.x,
          y: pos.y,
        };
      }
    }
  }

  return result;
}

function slotToCanvasPosition(
  slot: FormationSlot,
  teamSide: "home" | "away",
  layout: PitchLayout
): { x: number; y: number } {
  let pctX = slot.x;
  let pctY = slot.y;

  if (teamSide === "away") {
    // Mirror: away team plays on the opposite half
    pctX = 100 - pctX;
    pctY = 100 - pctY;
  }

  return percentToCanvas(pctX, pctY, layout);
}

export function getStartingEleven(players: Player[]): Player[] {
  // Pick best 11: 1 GK + 10 outfield sorted by position priority
  const gk = players.find((p) => p.position === "GK");
  const outfield = players.filter((p) => p.position !== "GK");

  const posOrder: Record<string, number> = {
    CB: 1, RB: 2, LB: 3, RWB: 2, LWB: 3,
    CDM: 4, CM: 5, CAM: 6, RM: 7, LM: 7,
    RW: 8, LW: 8, CF: 9, ST: 10,
  };

  const sorted = outfield.sort(
    (a, b) => (posOrder[a.position] ?? 11) - (posOrder[b.position] ?? 11)
  );

  const starting = gk ? [gk, ...sorted.slice(0, 10)] : sorted.slice(0, 11);
  return starting;
}

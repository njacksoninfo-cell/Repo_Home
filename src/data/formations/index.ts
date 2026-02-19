import type { Formation } from "@/types/formation";
import formationData from "./formations.json";

const formations: Formation[] = formationData.formations;

export function getAllFormations(): Formation[] {
  return formations;
}

export function getFormationById(id: string): Formation | null {
  return formations.find((f) => f.id === id) || null;
}

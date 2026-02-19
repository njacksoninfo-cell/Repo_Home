"use client";

import { useBoardStore } from "@/stores/boardStore";
import { getAllFormations } from "@/data/formations";
import type { Formation } from "@/types/formation";

interface FormationSelectorProps {
  side: "home" | "away";
}

export default function FormationSelector({ side }: FormationSelectorProps) {
  const homeFormation = useBoardStore((s) => s.homeFormation);
  const awayFormation = useBoardStore((s) => s.awayFormation);
  const setHomeFormation = useBoardStore((s) => s.setHomeFormation);
  const setAwayFormation = useBoardStore((s) => s.setAwayFormation);

  const selectedFormation = side === "home" ? homeFormation : awayFormation;
  const setFormation = side === "home" ? setHomeFormation : setAwayFormation;

  const formations = getAllFormations();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formationId = e.target.value;
    if (!formationId) {
      setFormation(null);
      return;
    }
    const formation = formations.find((f) => f.id === formationId);
    if (formation) setFormation(formation);
  };

  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] text-text-muted uppercase tracking-wider">
        Formation
      </label>
      <select
        value={selectedFormation?.id || ""}
        onChange={handleChange}
        className="bg-surface border border-border text-foreground text-xs rounded px-2 py-1.5 outline-none focus:border-accent min-w-[90px] cursor-pointer"
      >
        <option value="">None</option>
        {formations.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </div>
  );
}

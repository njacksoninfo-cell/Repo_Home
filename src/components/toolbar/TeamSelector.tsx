"use client";

import { useBoardStore } from "@/stores/boardStore";
import { getTeamsByLeague, getAllTeams } from "@/data/teams";
import type { Team } from "@/types/team";
import type { League } from "@/types/team";

interface TeamSelectorProps {
  side: "home" | "away";
}

export default function TeamSelector({ side }: TeamSelectorProps) {
  const homeTeam = useBoardStore((s) => s.homeTeam);
  const awayTeam = useBoardStore((s) => s.awayTeam);
  const setHomeTeam = useBoardStore((s) => s.setHomeTeam);
  const setAwayTeam = useBoardStore((s) => s.setAwayTeam);

  const selectedTeam = side === "home" ? homeTeam : awayTeam;
  const setTeam = side === "home" ? setHomeTeam : setAwayTeam;

  const mlsTeams = getTeamsByLeague("mls");
  const eplTeams = getTeamsByLeague("epl");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value;
    if (!teamId) {
      setTeam(null);
      return;
    }
    const allTeams = getAllTeams();
    const team = allTeams.find((t) => t.id === teamId);
    if (team) setTeam(team);
  };

  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] text-text-muted uppercase tracking-wider">
        {side === "home" ? "Home" : "Away"}
      </label>
      <select
        value={selectedTeam?.id || ""}
        onChange={handleChange}
        className="bg-surface border border-border text-foreground text-xs rounded px-2 py-1.5 outline-none focus:border-accent min-w-[140px] cursor-pointer"
      >
        <option value="">Select team...</option>
        <optgroup label="MLS">
          {mlsTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Premier League">
          {eplTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

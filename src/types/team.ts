export type League = "mls" | "epl";

export type PlayerPosition =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "LWB"
  | "RWB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "RW"
  | "ST"
  | "CF";

export interface Player {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
}

export interface TeamColors {
  primary: string;
  secondary: string;
  accent?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  league: League;
  conference?: string;
  colors: TeamColors;
  players: Player[];
}

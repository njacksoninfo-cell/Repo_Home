import type { Team, League } from "@/types/team";

// MLS Teams
import atlantaUnited from "./mls/atlanta-united.json";
import austinFc from "./mls/austin-fc.json";
import cfMontreal from "./mls/cf-montreal.json";
import charlotteFc from "./mls/charlotte-fc.json";
import chicagoFire from "./mls/chicago-fire.json";
import coloradoRapids from "./mls/colorado-rapids.json";
import columbusCrew from "./mls/columbus-crew.json";
import dcUnited from "./mls/dc-united.json";
import fcCincinnati from "./mls/fc-cincinnati.json";
import fcDallas from "./mls/fc-dallas.json";
import houstonDynamo from "./mls/houston-dynamo.json";
import interMiami from "./mls/inter-miami.json";
import laGalaxy from "./mls/la-galaxy.json";
import losAngelesFc from "./mls/los-angeles-fc.json";
import minnesotaUnited from "./mls/minnesota-united.json";
import nashvilleSc from "./mls/nashville-sc.json";
import newEnglandRevolution from "./mls/new-england-revolution.json";
import newYorkCityFc from "./mls/new-york-city-fc.json";
import newYorkRedBulls from "./mls/new-york-red-bulls.json";
import orlandoCity from "./mls/orlando-city.json";
import philadelphiaUnion from "./mls/philadelphia-union.json";
import portlandTimbers from "./mls/portland-timbers.json";
import realSaltLake from "./mls/real-salt-lake.json";
import sanDiegoFc from "./mls/san-diego-fc.json";
import sanJoseEarthquakes from "./mls/san-jose-earthquakes.json";
import seattleSounders from "./mls/seattle-sounders.json";
import sportingKansasCity from "./mls/sporting-kansas-city.json";
import stLouisCity from "./mls/st-louis-city.json";
import torontoFc from "./mls/toronto-fc.json";
import vancouverWhitecaps from "./mls/vancouver-whitecaps.json";

// EPL Teams
import arsenal from "./epl/arsenal.json";
import astonVilla from "./epl/aston-villa.json";
import bournemouth from "./epl/bournemouth.json";
import brentford from "./epl/brentford.json";
import brighton from "./epl/brighton.json";
import chelsea from "./epl/chelsea.json";
import crystalPalace from "./epl/crystal-palace.json";
import everton from "./epl/everton.json";
import fulham from "./epl/fulham.json";
import ipswichTown from "./epl/ipswich-town.json";
import leicesterCity from "./epl/leicester-city.json";
import liverpool from "./epl/liverpool.json";
import manchesterCity from "./epl/manchester-city.json";
import manchesterUnited from "./epl/manchester-united.json";
import newcastleUnited from "./epl/newcastle-united.json";
import nottinghamForest from "./epl/nottingham-forest.json";
import southampton from "./epl/southampton.json";
import tottenham from "./epl/tottenham.json";
import westHam from "./epl/west-ham.json";
import wolverhampton from "./epl/wolverhampton.json";

// Cast helper
const t = (data: unknown): Team => data as Team;

const mlsTeams: Team[] = [
  t(atlantaUnited),
  t(austinFc),
  t(cfMontreal),
  t(charlotteFc),
  t(chicagoFire),
  t(coloradoRapids),
  t(columbusCrew),
  t(dcUnited),
  t(fcCincinnati),
  t(fcDallas),
  t(houstonDynamo),
  t(interMiami),
  t(laGalaxy),
  t(losAngelesFc),
  t(minnesotaUnited),
  t(nashvilleSc),
  t(newEnglandRevolution),
  t(newYorkCityFc),
  t(newYorkRedBulls),
  t(orlandoCity),
  t(philadelphiaUnion),
  t(portlandTimbers),
  t(realSaltLake),
  t(sanDiegoFc),
  t(sanJoseEarthquakes),
  t(seattleSounders),
  t(sportingKansasCity),
  t(stLouisCity),
  t(torontoFc),
  t(vancouverWhitecaps),
].sort((a, b) => a.name.localeCompare(b.name));

const eplTeams: Team[] = [
  t(arsenal),
  t(astonVilla),
  t(bournemouth),
  t(brentford),
  t(brighton),
  t(chelsea),
  t(crystalPalace),
  t(everton),
  t(fulham),
  t(ipswichTown),
  t(leicesterCity),
  t(liverpool),
  t(manchesterCity),
  t(manchesterUnited),
  t(newcastleUnited),
  t(nottinghamForest),
  t(southampton),
  t(tottenham),
  t(westHam),
  t(wolverhampton),
].sort((a, b) => a.name.localeCompare(b.name));

export function getTeamsByLeague(league: League): Team[] {
  return league === "mls" ? mlsTeams : eplTeams;
}

export function getAllTeams(): Team[] {
  return [...mlsTeams, ...eplTeams];
}

export function getTeamById(id: string): Team | null {
  return getAllTeams().find((t) => t.id === id) || null;
}

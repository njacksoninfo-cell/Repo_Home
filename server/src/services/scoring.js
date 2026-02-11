/**
 * MLS Fantasy Scoring Engine
 *
 * Scoring rules based on the official MLS Fantasy game (2024/2025 season).
 * Points are awarded per gameweek based on real-life player performance.
 */

const SCORING_RULES = {
  // Minutes played
  minutes: {
    played_up_to_60: 1,   // 1 pt for appearing (1-59 min)
    played_60_plus: 2,     // 2 pts for playing 60+ minutes
  },

  // Goals scored (varies by position)
  goals: {
    GK: 6,
    DEF: 6,
    MID: 5,
    FWD: 4,
  },

  // Assists (all positions)
  assists: 3,

  // Clean sheets (team concedes 0 goals, player must play 60+ min)
  clean_sheet: {
    GK: 4,
    DEF: 4,
    MID: 1,
    FWD: 0,
  },

  // Goals conceded (per 2 goals conceded, GK/DEF only, must play 60+ min)
  goals_conceded_per_2: {
    GK: -1,
    DEF: -1,
    MID: 0,
    FWD: 0,
  },

  // Saves (GK only, per 3 saves)
  saves_per_3: 1,

  // Penalty save
  penalty_save: 5,

  // Penalty miss
  penalty_miss: -2,

  // Cards
  yellow_card: -1,
  red_card: -3,

  // Own goal
  own_goal: -2,

  // Bonus points
  bonus: {
    big_chance_created: 1,           // +1 per big chance created
    accurate_crosses_per_3: 1,       // +1 per 3 accurate crosses
    key_passes_per_4: 1,             // +1 per 4 key passes (changed from 3 in 2024)
    passing_accuracy_threshold: 0.85, // Must have 85%+ accuracy
    passing_attempts_threshold: 35,   // Must have 35+ passes attempted
    passing_accuracy_bonus: 1,        // +1 if passing accuracy met
    clearances_per_3: 1,             // +1 per 3 clearances
    shots_on_target_per_2: 1,        // +1 per 2 shots on target
  },
};

/**
 * Calculate fantasy points for a single player's gameweek performance.
 */
export function calculatePoints(stats, position) {
  let points = 0;
  const breakdown = {};

  // Minutes played
  if (stats.minutes_played > 0) {
    if (stats.minutes_played >= 60) {
      points += SCORING_RULES.minutes.played_60_plus;
      breakdown.minutes = SCORING_RULES.minutes.played_60_plus;
    } else {
      points += SCORING_RULES.minutes.played_up_to_60;
      breakdown.minutes = SCORING_RULES.minutes.played_up_to_60;
    }
  } else {
    return { points: 0, breakdown: { minutes: 0 } };
  }

  // Goals
  if (stats.goals > 0) {
    const goalPoints = stats.goals * (SCORING_RULES.goals[position] || 0);
    points += goalPoints;
    breakdown.goals = goalPoints;
  }

  // Assists
  if (stats.assists > 0) {
    const assistPoints = stats.assists * SCORING_RULES.assists;
    points += assistPoints;
    breakdown.assists = assistPoints;
  }

  // Clean sheet (must play 60+ min)
  if (stats.clean_sheet && stats.minutes_played >= 60) {
    const csPoints = SCORING_RULES.clean_sheet[position] || 0;
    points += csPoints;
    breakdown.clean_sheet = csPoints;
  }

  // Goals conceded (per 2, GK/DEF only, must play 60+ min)
  if (stats.goals_conceded > 0 && stats.minutes_played >= 60) {
    const gcPenalty = Math.floor(stats.goals_conceded / 2) * (SCORING_RULES.goals_conceded_per_2[position] || 0);
    points += gcPenalty;
    breakdown.goals_conceded = gcPenalty;
  }

  // Saves (GK only, per 3)
  if (position === 'GK' && stats.saves > 0) {
    const savePoints = Math.floor(stats.saves / 3) * SCORING_RULES.saves_per_3;
    points += savePoints;
    breakdown.saves = savePoints;
  }

  // Penalty save
  if (stats.penalties_saved > 0) {
    const psSavePoints = stats.penalties_saved * SCORING_RULES.penalty_save;
    points += psSavePoints;
    breakdown.penalty_save = psSavePoints;
  }

  // Penalty miss
  if (stats.penalties_missed > 0) {
    const pmPoints = stats.penalties_missed * SCORING_RULES.penalty_miss;
    points += pmPoints;
    breakdown.penalty_miss = pmPoints;
  }

  // Cards
  if (stats.red_cards > 0) {
    points += SCORING_RULES.red_card;
    breakdown.red_card = SCORING_RULES.red_card;
  } else if (stats.yellow_cards > 0) {
    const ycPoints = stats.yellow_cards * SCORING_RULES.yellow_card;
    points += ycPoints;
    breakdown.yellow_card = ycPoints;
  }

  // Own goals
  if (stats.own_goals > 0) {
    const ogPoints = stats.own_goals * SCORING_RULES.own_goal;
    points += ogPoints;
    breakdown.own_goals = ogPoints;
  }

  // Bonus: Big chances created
  if (stats.big_chances_created > 0) {
    const bccPoints = stats.big_chances_created * SCORING_RULES.bonus.big_chance_created;
    points += bccPoints;
    breakdown.big_chances_created = bccPoints;
  }

  // Bonus: Accurate crosses (per 3)
  if (stats.accurate_crosses > 0) {
    const crossPoints = Math.floor(stats.accurate_crosses / 3) * SCORING_RULES.bonus.accurate_crosses_per_3;
    points += crossPoints;
    breakdown.accurate_crosses = crossPoints;
  }

  // Bonus: Key passes (per 4)
  if (stats.key_passes > 0) {
    const kpPoints = Math.floor(stats.key_passes / 4) * SCORING_RULES.bonus.key_passes_per_4;
    points += kpPoints;
    breakdown.key_passes = kpPoints;
  }

  // Bonus: Passing accuracy (85%+ on 35+ passes)
  if (stats.passes_attempted >= SCORING_RULES.bonus.passing_attempts_threshold) {
    const accuracy = stats.passes_completed / stats.passes_attempted;
    if (accuracy >= SCORING_RULES.bonus.passing_accuracy_threshold) {
      points += SCORING_RULES.bonus.passing_accuracy_bonus;
      breakdown.passing_accuracy = SCORING_RULES.bonus.passing_accuracy_bonus;
    }
  }

  // Bonus: Clearances (per 3)
  if (stats.clearances > 0) {
    const clrPoints = Math.floor(stats.clearances / 3) * SCORING_RULES.bonus.clearances_per_3;
    points += clrPoints;
    breakdown.clearances = clrPoints;
  }

  // Bonus: Shots on target (per 2)
  if (stats.shots_on_target > 0) {
    const sotPoints = Math.floor(stats.shots_on_target / 2) * SCORING_RULES.bonus.shots_on_target_per_2;
    points += sotPoints;
    breakdown.shots_on_target = sotPoints;
  }

  return { points, breakdown };
}

/**
 * Calculate total squad points for a gameweek, including captain doubling.
 */
export function calculateSquadPoints(squadPlayers, gameweekStats) {
  let totalPoints = 0;
  const playerResults = [];

  for (const sp of squadPlayers) {
    if (!sp.is_starter) continue;

    const stats = gameweekStats.find(s => s.player_id === sp.player_id);
    if (!stats) continue;

    const { points, breakdown } = calculatePoints(stats, sp.position);
    const multiplier = sp.is_captain ? 2 : 1;
    const finalPoints = points * multiplier;
    totalPoints += finalPoints;

    playerResults.push({
      player_id: sp.player_id,
      name: sp.name,
      position: sp.position,
      is_captain: sp.is_captain,
      raw_points: points,
      final_points: finalPoints,
      breakdown,
    });
  }

  return { totalPoints, playerResults };
}

export { SCORING_RULES };

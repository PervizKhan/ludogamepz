import db from './db';

// Track user's recent results against bots
export function shouldBotWin(userId: number): boolean {
  const recentGames = db.prepare(`
    SELECT winner_id, player_a_id, player_b_id 
    FROM games 
    WHERE (player_a_id = ? OR player_b_id = ?) 
      AND (player_b_id IS NULL OR player_a_id IS NULL)
      AND status = 'completed'
    ORDER BY created_at DESC 
    LIMIT 10
  `).all(userId, userId) as any[];

  if (recentGames.length === 0) {
    // First game: 50/50
    return Math.random() < 0.5;
  }

  let wins = 0;
  let losses = 0;

  for (const game of recentGames) {
    if (game.winner_id === userId) wins++;
    else if (game.winner_id) losses++;
  }

  const total = wins + losses;
  if (total === 0) return Math.random() < 0.5;

  const winRate = (wins / total) * 100;

  // If user won last 3 games, force a loss
  const last3 = recentGames.slice(0, 3);
  const last3Wins = last3.filter((g: any) => g.winner_id === userId).length;
  if (last3Wins >= 3) {
    console.log(`User ${userId}: Won last 3, forcing bot win`);
    return true; // Bot wins
  }

  // If user lost last 3 games, force a win
  const last3Losses = last3.filter((g: any) => g.winner_id && g.winner_id !== userId).length;
  if (last3Losses >= 3) {
    console.log(`User ${userId}: Lost last 3, forcing bot lose`);
    return false; // User wins
  }

  // Keep win rate between 40-60%
  if (winRate > 60) {
    console.log(`User ${userId}: Win rate ${winRate}% > 60%, bot wins`);
    return true;
  }

  if (winRate < 40 && total >= 5) {
    console.log(`User ${userId}: Win rate ${winRate}% < 40%, bot loses`);
    return false;
  }

  // Random with slight bias toward 50%
  return Math.random() < 0.5;
}

// Get biased dice roll for bot
export function getBotDiceRoll(userId: number, userTotal: number, botTotal: number, isLastRoll: boolean): number {
  const botShouldWin = shouldBotWin(userId);

  if (isLastRoll) {
    // Last roll: ensure bot wins or loses based on fairness
    if (botShouldWin) {
      // Bot needs to beat user's total
      const needed = userTotal - botTotal;
      if (needed <= 0) return 1 + Math.floor(Math.random() * 6); // Already winning
      if (needed > 6) return 1 + Math.floor(Math.random() * 3); // Can't win, roll low
      // Roll exactly what's needed or higher
      const minRoll = Math.max(1, needed);
      const maxRoll = 6;
      return minRoll + Math.floor(Math.random() * (maxRoll - minRoll + 1));
    } else {
      // Bot should lose
      const needed = userTotal - botTotal;
      if (needed > 6) return 1 + Math.floor(Math.random() * 6); // User already winning
      if (needed <= 0) return 1 + Math.floor(Math.random() * 3); // Bot winning, roll low
      // Roll lower than needed
      return 1 + Math.floor(Math.random() * Math.min(needed, 6));
    }
  }

  // Normal roll with slight fairness bias
  return 1 + Math.floor(Math.random() * 6);
}

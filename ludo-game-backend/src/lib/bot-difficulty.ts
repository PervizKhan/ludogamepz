import { Game } from '@/models/Game';

export async function shouldBotWin(userId: string): Promise<boolean> {
  const recentGames = await Game.find({
    $and: [
      { $or: [{ playerAId: userId }, { playerBId: userId }] },
      { $or: [{ playerBId: null }, { playerAId: null }] }
    ],
    status: 'completed'
  }).sort({ createdAt: -1 }).limit(10);

  if (recentGames.length === 0) return Math.random() < 0.5;

  let wins = 0, losses = 0;
  for (const game of recentGames) {
    if (game.winnerId === userId) wins++;
    else if (game.winnerId) losses++;
  }

  const total = wins + losses;
  if (total === 0) return Math.random() < 0.5;

  const winRate = (wins / total) * 100;

  const last3 = recentGames.slice(0, 3);
  const last3Wins = last3.filter(g => g.winnerId === userId).length;
  if (last3Wins >= 3) return true;

  const last3Losses = last3.filter(g => g.winnerId && g.winnerId !== userId).length;
  if (last3Losses >= 3) return false;

  if (winRate > 60) return true;
  if (winRate < 40 && total >= 5) return false;

  return Math.random() < 0.5;
}

export function getBotDiceRoll(userTotal: number, botTotal: number, isLastRoll: boolean, botShouldWin: boolean): number {
  if (isLastRoll) {
    if (botShouldWin) {
      const needed = userTotal - botTotal;
      if (needed <= 0) return 1 + Math.floor(Math.random() * 6);
      if (needed > 6) return 1 + Math.floor(Math.random() * 3);
      return Math.max(1, needed) + Math.floor(Math.random() * (7 - Math.max(1, needed)));
    } else {
      const needed = userTotal - botTotal;
      if (needed > 6) return 1 + Math.floor(Math.random() * 6);
      if (needed <= 0) return 1 + Math.floor(Math.random() * 3);
      return 1 + Math.floor(Math.random() * Math.min(needed, 6));
    }
  }
  return 1 + Math.floor(Math.random() * 6);
}

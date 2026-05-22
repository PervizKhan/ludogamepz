import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game } from '@/models/Game';

export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily';

  let dateFilter: any = {};
  if (type === 'daily') dateFilter = { createdAt: { $gte: new Date(Date.now() - 86400000) } };
  else if (type === 'weekly') dateFilter = { createdAt: { $gte: new Date(Date.now() - 604800000) } };

  const games = await Game.find({ status: 'completed', ...dateFilter });
  const userStats: any = {};
  games.forEach(g => {
    const aId = g.playerAId, bId = g.playerBId;
    if (aId) { if (!userStats[aId]) userStats[aId] = { wins: 0, total: 0, winnings: 0, username: g.playerAName }; userStats[aId].total++; if (g.winnerId === aId) { userStats[aId].wins++; userStats[aId].winnings += g.betAmount; } }
    if (bId) { if (!userStats[bId]) userStats[bId] = { wins: 0, total: 0, winnings: 0, username: g.playerBName }; userStats[bId].total++; if (g.winnerId === bId) { userStats[bId].wins++; userStats[bId].winnings += g.betAmount; } }
  });

  const leaderboard = Object.entries(userStats).map(([id, data]: any) => ({
    id, username: data.username, wins: data.wins, total_games: data.total,
    total_winnings: data.winnings, win_rate: data.total > 0 ? ((data.wins / data.total) * 100).toFixed(1) : 0
  })).sort((a: any, b: any) => b.total_winnings - a.total_winnings).slice(0, 20);

  return NextResponse.json({ success: true, leaderboard });
}

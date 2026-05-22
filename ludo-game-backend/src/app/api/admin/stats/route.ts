import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { User } from '@/models/User';
import { Game } from '@/models/Game';
import { Club } from '@/models/Club';

export async function GET(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const totalUsers = await User.countDocuments({ id: { $gt: 0 } });
  const totalGames = await Game.countDocuments();
  const activeGames = await Game.countDocuments({ status: 'playing' });
  const completedGames = await Game.find({ status: 'completed' });
  const totalRevenue = completedGames.reduce((s, g) => s + g.betAmount, 0);
  const todayGames = await Game.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } });

  const clubs = await Club.find();
  const clubStats = await Promise.all(clubs.map(async c => ({
    name: c.name, bet_amount: c.betAmount,
    games_played: await Game.countDocuments({ clubId: c._id })
  })));

  const recentActivity = await Game.find().sort({ createdAt: -1 }).limit(20);
  const botGames = await Game.countDocuments({ $or: [{ playerAId: null }, { playerBId: null }] });
  const realGames = totalGames - botGames;

  return NextResponse.json({
    overview: { totalUsers, totalGames, totalRevenue, activeGames, todayGames, todayVolume: totalRevenue, winLossRatio: '0', botPercentage: totalGames > 0 ? ((botGames / totalGames) * 100).toFixed(1) : '0' },
    clubStats, recentActivity: recentActivity.map(g => ({
      id: g._id, player_a_name: g.playerAName, player_b_name: g.playerBName, bet_amount: g.betAmount,
      player_a_total: g.playerATotal, player_b_total: g.playerBTotal, status: g.status,
      winner: g.winnerId === g.playerAId ? g.playerAName : g.winnerId === g.playerBId ? g.playerBName : g.winnerId === 0 ? g.playerBName || g.playerAName : 'Draw',
      created_at: g.createdAt
    })),
    botStats: { bot_games: botGames, real_games: realGames },
    hourlyActivity: []
  });
}

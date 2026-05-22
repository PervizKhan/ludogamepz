import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { Game } from '@/models/Game';

export async function GET(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const games = await Game.find().sort({ createdAt: -1 }).limit(50);
  return NextResponse.json({
    games: games.map(g => ({
      id: g._id, club_name: '', player_a_name: g.playerAName, player_b_name: g.playerBName,
      bet_amount: g.betAmount, player_a_rolls: g.playerARolls, player_b_rolls: g.playerBRolls,
      winner_name: g.winnerId === g.playerAId ? g.playerAName : g.winnerId === g.playerBId ? g.playerBName : g.winnerId === 0 ? (g.playerBName || g.playerAName) : 'Draw',
      status: g.status, created_at: g.createdAt
    }))
  });
}

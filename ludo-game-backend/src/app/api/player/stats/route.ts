import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { findUser } from '@/lib/user-utils';
import { Game } from '@/models/Game';

export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });

  const user = await findUser(userId);
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  const games = await Game.find({ status: 'completed', $or: [{ playerAId: user.id }, { playerBId: user.id }] });
  let wins = 0, winnings = 0;
  games.forEach(g => { if (g.winnerId === user.id) { wins++; winnings += g.betAmount; } });

  return NextResponse.json({ success: true, stats: { total_games: games.length, wins, total_winnings: winnings, win_rate: games.length > 0 ? ((wins / games.length) * 100).toFixed(1) : 0 } });
}

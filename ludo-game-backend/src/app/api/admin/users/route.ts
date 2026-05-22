import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { User } from '@/models/User';
import { Game } from '@/models/Game';

export async function GET(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const users = await User.find().sort({ id: 1 });
  const usersWithStats = await Promise.all(users.map(async u => {
    const games = await Game.countDocuments({ status: 'completed', $or: [{ playerAId: u.id }, { playerBId: u.id }] });
    const wins = await Game.countDocuments({ winnerId: u.id, status: 'completed' });
    return { id: u.id, username: u.username, balance: u.balance, total_games: games, wins, created_at: u.createdAt };
  }));

  return NextResponse.json({ users: usersWithStats });
}

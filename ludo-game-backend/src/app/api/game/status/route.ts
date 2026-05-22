import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Game } from '@/models/Game';

export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');
  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 });

  const game = await Game.findById(gameId);
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  return NextResponse.json({ success: true, game: { ...game.toObject(), player_a_rolls: game.playerARolls, player_b_rolls: game.playerBRolls, player_a_total: game.playerATotal, player_b_total: game.playerBTotal, current_turn: game.currentTurn, bet_amount: game.betAmount } });
}

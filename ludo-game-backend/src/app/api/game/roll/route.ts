import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { gameService } from '@/lib/game-service';
import { Game } from '@/models/Game';

export async function POST(request: NextRequest) {
  await connectDB();
  try {
    const body = await request.json();
    const { gameId, player } = body;
    if (!gameId || !player) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const game = await gameService.rollDice(gameId, player);

    return NextResponse.json({
      success: true, game,
      yourRoll: player === 'A' ? game.playerARolls.at(-1) : game.playerBRolls.at(-1),
      yourTotal: player === 'A' ? game.playerATotal : game.playerBTotal,
      opponentTotal: player === 'A' ? game.playerBTotal : game.playerATotal,
      isComplete: game.status === 'completed',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

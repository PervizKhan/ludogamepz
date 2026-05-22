import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/game-service';
import { Game } from '@/models/Game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, player } = body;
    console.log('Roll request:', { gameId, player });

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
    console.error('Roll error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

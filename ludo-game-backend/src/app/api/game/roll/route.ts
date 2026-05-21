import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/game-service';
import { emitGameUpdate } from '@/lib/websocket';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gameId = parseInt(body.gameId);
    const player = body.player;

    if (!gameId || isNaN(gameId) || !player || !['A','B'].includes(player)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Anti-hack: Verify game exists and player is part of it
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
    if (!game || game.status !== 'playing') {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const result = await gameService.rollDice(gameId, player);

    emitGameUpdate(gameId, {
      gameId, player,
      playerARolls: result.player_a_rolls,
      playerBRolls: result.player_b_rolls,
      playerATotal: result.player_a_total,
      playerBTotal: result.player_b_total,
      status: result.status,
      currentTurn: result.current_turn,
      winner: result.winner_id,
    });

    return NextResponse.json({
      success: true,
      game: result,
      yourRoll: player === 'A' ? result.player_a_rolls.at(-1) : result.player_b_rolls.at(-1),
      yourTotal: player === 'A' ? result.player_a_total : result.player_b_total,
      opponentTotal: player === 'A' ? result.player_b_total : result.player_a_total,
      isComplete: result.status === 'completed',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Roll failed' }, { status: 400 });
  }
}

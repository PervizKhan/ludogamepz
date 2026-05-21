import { NextRequest, NextResponse } from 'next/server';
import { matchmakingService } from '@/lib/matchmaking-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = parseInt(body.userId);
    const clubId = parseInt(body.clubId);
    const betAmount = parseInt(body.betAmount);
    const username = body.username;

    console.log('Matchmaking request:', { userId, username, clubId, betAmount });

    if (!userId || !clubId || !betAmount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const game = await matchmakingService.joinQueue({
      userId,
      username,
      clubId,
      betAmount,
      timestamp: Date.now(),
    });

    const isPlayerA = game.player_a_name === username;
    const playerSide = isPlayerA ? 'A' : 'B';
    const opponent = isPlayerA ? game.player_b_name : game.player_a_name;
    const isBot = game.player_b_id === null || game.player_a_id === null;

    return NextResponse.json({
      success: true,
      game,
      gameId: game.id,
      player: playerSide,
      opponent,
      isBot,
      currentTurn: game.current_turn || 'A',
      betAmount: game.bet_amount,
    });
  } catch (error: any) {
    console.error('Matchmaking error:', error.message);
    return NextResponse.json({ error: error.message || 'Matchmaking failed' }, { status: 400 });
  }
}

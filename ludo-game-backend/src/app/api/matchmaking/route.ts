import { NextRequest, NextResponse } from 'next/server';
import { matchmakingService } from '@/lib/matchmaking-service';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, clubId, betAmount } = body;

    console.log('Matchmaking:', { userId, username, clubId, betAmount });

    // Get user's balance
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.balance < parseInt(betAmount)) {
      return NextResponse.json({ error: `Insufficient coins. You have ${user.balance}, need ${betAmount}` }, { status: 400 });
    }

    const game = await matchmakingService.joinQueue({
      userId: user._id.toString(),
      username,
      clubId: parseInt(clubId),
      betAmount: parseInt(betAmount),
      timestamp: Date.now(),
    });

    const isPlayerA = game.playerAName === username;
    return NextResponse.json({
      success: true,
      game: { ...game.toObject(), player_a_name: game.playerAName, player_b_name: game.playerBName, current_turn: game.currentTurn, bet_amount: game.betAmount },
      gameId: game._id,
      player: isPlayerA ? 'A' : 'B',
      opponent: isPlayerA ? game.playerBName : game.playerAName,
      isBot: !game.playerBId,
      currentTurn: game.currentTurn,
      betAmount: game.betAmount,
    });
  } catch (error: any) {
    console.error('Matchmaking error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

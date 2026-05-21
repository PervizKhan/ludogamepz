import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/game-service';

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get('gameId');

  if (!gameId) {
    return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
  }

  const game = gameService.getGame(Number(gameId));

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json({ game });
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });
  }

  const db = getDb();

  const stats = db.prepare(`
    SELECT 
      COUNT(g.id) as total_games,
      COUNT(CASE WHEN g.winner_id = ? THEN 1 END) as wins,
      COALESCE(SUM(CASE WHEN g.winner_id = ? THEN g.bet_amount ELSE 0 END), 0) as total_winnings,
      CASE WHEN COUNT(g.id) > 0 
        THEN ROUND(CAST(COUNT(CASE WHEN g.winner_id = ? THEN 1 END) AS FLOAT) / COUNT(g.id) * 100, 1)
        ELSE 0 
      END as win_rate
    FROM games g
    WHERE (g.player_a_id = ? OR g.player_b_id = ?)
      AND g.status = 'completed'
  `).get(userId, userId, userId, userId, userId) as any;

  return NextResponse.json({ success: true, stats });
}

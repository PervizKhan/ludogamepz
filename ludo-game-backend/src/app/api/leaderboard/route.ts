import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily';

  const db = getDb();
  
  let dateFilter = '';
  if (type === 'daily') {
    dateFilter = "AND g.completed_at >= datetime('now', '-1 day')";
  } else if (type === 'weekly') {
    dateFilter = "AND g.completed_at >= datetime('now', '-7 days')";
  }

  const leaderboard = db.prepare(`
    SELECT 
      u.id,
      u.username,
      COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as wins,
      COUNT(g.id) as total_games,
      COALESCE(SUM(CASE WHEN g.winner_id = u.id THEN g.bet_amount ELSE 0 END), 0) as total_winnings,
      CASE WHEN COUNT(g.id) > 0 
        THEN ROUND(CAST(COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) AS FLOAT) / COUNT(g.id) * 100, 1)
        ELSE 0 
      END as win_rate
    FROM users u
    LEFT JOIN games g ON (g.player_a_id = u.id OR g.player_b_id = u.id) 
      AND g.status = 'completed'
      ${dateFilter}
    GROUP BY u.id
    ORDER BY total_winnings DESC
    LIMIT 20
  `).all();

  return NextResponse.json({ success: true, leaderboard });
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const users = db.prepare(`
    SELECT u.*,
      COUNT(g.id) as total_games,
      COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as wins
    FROM users u
    LEFT JOIN games g ON (g.player_a_id = u.id OR g.player_b_id = u.id) AND g.status = 'completed'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();

  return NextResponse.json({ users });
}

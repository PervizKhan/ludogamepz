import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
import { parseRolls } from '@/lib/json-utils';

export async function GET(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const games = db.prepare(`
    SELECT g.*, c.name as club_name,
      CASE 
        WHEN g.winner_id IS NULL OR g.winner_id = 0 THEN 
          CASE WHEN g.player_a_total > g.player_b_total THEN g.player_a_name
               WHEN g.player_b_total > g.player_a_total THEN g.player_b_name
               ELSE 'Draw' END
        WHEN g.winner_id = g.player_a_id THEN g.player_a_name
        WHEN g.winner_id = g.player_b_id THEN g.player_b_name
        ELSE 'Draw'
      END as winner_name
    FROM games g
    LEFT JOIN clubs c ON g.club_id = c.id
    ORDER BY g.created_at DESC LIMIT 50
  `).all() as any[];

  const parsed = games.map(g => ({
    ...g,
    player_a_rolls: parseRolls(g.player_a_rolls),
    player_b_rolls: parseRolls(g.player_b_rolls),
  }));

  return NextResponse.json({ games: parsed });
}

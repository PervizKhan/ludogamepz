import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const authError = verifyAdmin(request);
  if (authError) return authError;

  const overview = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE id > 0) as totalUsers,
      (SELECT COUNT(*) FROM games) as totalGames,
      (SELECT COALESCE(SUM(bet_amount), 0) FROM games WHERE status = 'completed') as totalRevenue,
      (SELECT COUNT(*) FROM games WHERE status = 'playing') as activeGames,
      (SELECT COUNT(*) FROM games WHERE date(created_at) = date('now')) as todayGames,
      (SELECT COALESCE(SUM(bet_amount), 0) FROM games WHERE date(created_at) = date('now') AND status = 'completed') as todayVolume,
      (SELECT COALESCE(ROUND(CAST(SUM(CASE WHEN winner_id IS NOT NULL AND winner_id > 0 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 1), 0) FROM games WHERE status = 'completed') as winLossRatio,
      (SELECT COALESCE(ROUND(CAST(COUNT(CASE WHEN player_b_id IS NULL OR player_a_id IS NULL THEN 1 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 1), 0) FROM games) as botPercentage
  `).get() as any;

  const clubStats = db.prepare(`
    SELECT c.name, c.bet_amount, COUNT(g.id) as games_played
    FROM clubs c LEFT JOIN games g ON c.id = g.club_id
    GROUP BY c.id ORDER BY games_played DESC
  `).all();

  const recentActivity = db.prepare(`
    SELECT g.*, 
      CASE 
        WHEN g.winner_id IS NULL OR g.winner_id = 0 THEN 
          CASE WHEN g.player_a_total > g.player_b_total THEN g.player_a_name
               WHEN g.player_b_total > g.player_a_total THEN g.player_b_name
               ELSE 'Draw' END
        WHEN g.winner_id = g.player_a_id THEN g.player_a_name
        WHEN g.winner_id = g.player_b_id THEN g.player_b_name
        ELSE 'Draw'
      END as winner
    FROM games g
    ORDER BY g.created_at DESC LIMIT 20
  `).all();

  const botStats = db.prepare(`
    SELECT
      COUNT(CASE WHEN player_b_id IS NULL OR player_a_id IS NULL THEN 1 END) as bot_games,
      COUNT(CASE WHEN player_b_id IS NOT NULL AND player_a_id IS NOT NULL THEN 1 END) as real_games
    FROM games
  `).get() as any;

  const hourlyActivity = db.prepare(`
    SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as games, COALESCE(SUM(bet_amount), 0) as volume
    FROM games WHERE date(created_at) = date('now')
    GROUP BY strftime('%H', created_at) ORDER BY hour
  `).all();

  return NextResponse.json({ overview, clubStats, recentActivity, botStats, hourlyActivity });
}

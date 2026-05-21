import db from './db';

export class LeaderboardService {
  // Get daily leaderboard
  getDailyLeaderboard(limit: number = 50) {
    return db.prepare(`
      SELECT 
        u.id,
        u.username,
        COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as wins,
        COUNT(CASE WHEN u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed' THEN 1 END) as total_games,
        SUM(CASE WHEN t.type = 'win' THEN t.amount ELSE 0 END) as total_winnings,
        SUM(CASE WHEN t.type = 'loss' THEN ABS(t.amount) ELSE 0 END) as total_losses
      FROM users u
      LEFT JOIN games g ON u.id IN (g.player_a_id, g.player_b_id) AND DATE(g.created_at) = DATE('now')
      LEFT JOIN transactions t ON u.id = t.user_id AND DATE(t.created_at) = DATE('now')
      GROUP BY u.id
      HAVING total_games > 0
      ORDER BY wins DESC, total_winnings DESC
      LIMIT ?
    `).all(limit);
  }

  // Get weekly leaderboard
  getWeeklyLeaderboard(limit: number = 50) {
    return db.prepare(`
      SELECT 
        u.id,
        u.username,
        COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as wins,
        COUNT(CASE WHEN u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed' THEN 1 END) as total_games,
        SUM(CASE WHEN t.type = 'win' THEN t.amount ELSE 0 END) as total_winnings,
        ROUND(
          (COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) * 100.0) / 
          NULLIF(COUNT(CASE WHEN u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed' THEN 1 END), 0),
          2
        ) as win_rate
      FROM users u
      LEFT JOIN games g ON u.id IN (g.player_a_id, g.player_b_id) 
        AND g.created_at >= datetime('now', '-7 days')
      LEFT JOIN transactions t ON u.id = t.user_id 
        AND t.created_at >= datetime('now', '-7 days')
      GROUP BY u.id
      HAVING total_games > 0
      ORDER BY wins DESC, win_rate DESC
      LIMIT ?
    `).all(limit);
  }

  // Get all-time leaderboard
  getAllTimeLeaderboard(limit: number = 100) {
    return db.prepare(`
      SELECT 
        u.id,
        u.username,
        COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as wins,
        COUNT(CASE WHEN u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed' THEN 1 END) as total_games,
        SUM(CASE WHEN t.type = 'win' THEN t.amount ELSE 0 END) as total_winnings,
        SUM(CASE WHEN t.type = 'loss' THEN ABS(t.amount) ELSE 0 END) as total_losses,
        ROUND(
          (COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) * 100.0) / 
          NULLIF(COUNT(CASE WHEN u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed' THEN 1 END), 0),
          2
        ) as win_rate,
        RANK() OVER (ORDER BY COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) DESC) as rank
      FROM users u
      LEFT JOIN games g ON u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed'
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id
      HAVING total_games >= 5
      ORDER BY wins DESC, win_rate DESC
      LIMIT ?
    `).all(limit);
  }

  // Get player stats
  getPlayerStats(userId: number) {
    return db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.balance,
        COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as wins,
        COUNT(CASE WHEN u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed' THEN 1 END) as total_games,
        SUM(CASE WHEN t.type = 'win' THEN t.amount ELSE 0 END) as total_winnings,
        SUM(CASE WHEN t.type = 'loss' THEN ABS(t.amount) ELSE 0 END) as total_losses,
        MAX(g.bet_amount) as highest_bet,
        COUNT(CASE WHEN g.player_b_id IS NULL AND u.id IN (g.player_a_id, g.player_b_id) THEN 1 END) as bot_games
      FROM users u
      LEFT JOIN games g ON u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed'
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(userId);
  }

  // Get player rank
  getPlayerRank(userId: number): number | null {
    const result = db.prepare(`
      SELECT rank FROM (
        SELECT 
          u.id,
          RANK() OVER (ORDER BY COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) DESC) as rank
        FROM users u
        LEFT JOIN games g ON u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed'
        GROUP BY u.id
        HAVING COUNT(CASE WHEN u.id IN (g.player_a_id, g.player_b_id) AND g.status = 'completed' THEN 1 END) >= 5
      ) WHERE id = ?
    `).get(userId) as { rank: number } | undefined;

    return result?.rank ?? null;
  }
}

export const leaderboardService = new LeaderboardService();

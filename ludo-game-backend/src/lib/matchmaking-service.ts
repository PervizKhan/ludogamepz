import { MatchmakingRequest, Game } from '@/types';
import { botService } from './bot-service';
import db from './db';
import { parseRolls } from './json-utils';

const CLEANUP_INTERVAL = 5000;

export class MatchmakingService {
  private queue: Map<number, MatchmakingRequest> = new Map();
  private callbacks: Map<number, Function[]> = new Map();

  constructor() {
    setInterval(() => this.processQueue(), CLEANUP_INTERVAL);
  }

  async joinQueue(request: MatchmakingRequest): Promise<Game> {
    const { userId, clubId, username, betAmount } = request;

    if (!userId || userId < 1) throw new Error('Invalid user');
    if (!betAmount || betAmount < 10 || betAmount > 5000) throw new Error('Invalid bet amount');

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;
    if (!user) throw new Error('User not found');
    if (user.balance < betAmount) throw new Error(`Insufficient coins. You have ${user.balance}, need ${betAmount}`);

    // Auto-complete any stuck active game for this user
    db.prepare("UPDATE games SET status = 'completed' WHERE (player_a_id = ? OR player_b_id = ?) AND status = 'playing'").run(userId, userId);

    const waitingRequest = this.queue.get(clubId);
    if (waitingRequest && waitingRequest.userId !== userId) {
      this.queue.delete(clubId);
      return this.createGame(clubId, waitingRequest, request);
    }

    this.queue.set(clubId, request);
    const timeout = 10000 + Math.floor(Math.random() * 6000);

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        if (this.queue.get(clubId)?.userId === userId) {
          this.queue.delete(clubId);
          const bot = botService.generateBot();
          const game = this.createGame(clubId, request, {
            userId: -1, username: bot.name, clubId, betAmount, timestamp: Date.now()
          });
          resolve(game);
        }
      }, timeout);
      const callbacks = this.callbacks.get(clubId) || [];
      callbacks.push((game: Game) => { clearTimeout(timer); resolve(game); });
      this.callbacks.set(clubId, callbacks);
    });
  }

  private createGame(clubId: number, playerA: MatchmakingRequest, playerB: MatchmakingRequest): Game {
    const isBotGame = playerB.userId === -1;
    const firstTurn = Math.random() < 0.5 ? 'A' : 'B';

    const result = db.prepare(`
      INSERT INTO games (club_id, player_a_id, player_b_id, player_a_name, player_b_name, bet_amount, current_turn, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'playing')
    `).run(clubId, playerA.userId, isBotGame ? null : playerB.userId, playerA.username, playerB.username, playerA.betAmount, firstTurn);

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid) as Game;
    game.player_a_rolls = parseRolls(game.player_a_rolls);
    game.player_b_rolls = parseRolls(game.player_b_rolls);

    if (isBotGame && firstTurn === 'B') {
      const delay = 3000 + Math.random() * 4000;
      setTimeout(async () => {
        try { const { gameService } = await import('./game-service'); await gameService.rollDice(game.id, 'B'); } catch (err) {}
      }, delay);
    }

    return game;
  }

  private processQueue() {}
  
  leaveQueue(userId: number, clubId: number) {
    const request = this.queue.get(clubId);
    if (request && request.userId === userId) this.queue.delete(clubId);
  }
}

export const matchmakingService = new MatchmakingService();

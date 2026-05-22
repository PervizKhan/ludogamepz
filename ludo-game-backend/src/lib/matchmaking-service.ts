import { Game } from '@/models/Game';
import { User } from '@/models/User';
import { botService } from './bot-service';

const CLEANUP_INTERVAL = 5000;

interface MatchmakingRequest {
  userId: string;
  username: string;
  clubId: number;
  betAmount: number;
  timestamp: number;
}

export class MatchmakingService {
  private queue: Map<number, MatchmakingRequest> = new Map();
  private callbacks: Map<number, Function[]> = new Map();

  constructor() { setInterval(() => this.processQueue(), CLEANUP_INTERVAL); }

  async joinQueue(request: MatchmakingRequest) {
    const { userId, clubId, username, betAmount } = request;

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.balance < betAmount) throw new Error(`Insufficient coins. You have ${user.balance}, need ${betAmount}`);

    await Game.updateMany(
      { $or: [{ playerAId: userId }, { playerBId: userId }], status: 'playing' },
      { status: 'completed' }
    );

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
          resolve(this.createGame(clubId, request, { userId: 'bot', username: bot.name, clubId, betAmount, timestamp: Date.now() }));
        }
      }, timeout);
      const callbacks = this.callbacks.get(clubId) || [];
      callbacks.push((game: any) => { clearTimeout(timer); resolve(game); });
      this.callbacks.set(clubId, callbacks);
    });
  }

  private async createGame(clubId: number, playerA: MatchmakingRequest, playerB: MatchmakingRequest) {
    const isBotGame = playerB.userId === 'bot';
    const firstTurn = Math.random() < 0.5 ? 'A' : 'B';

    const game = await Game.create({
      clubId,
      playerAId: playerA.userId,
      playerBId: isBotGame ? null : playerB.userId,
      playerAName: playerA.username,
      playerBName: playerB.username,
      betAmount: playerA.betAmount,
      currentTurn: firstTurn,
      status: 'playing',
    });

    if (isBotGame && firstTurn === 'B') {
      setTimeout(async () => {
        try { const { gameService } = await import('./game-service'); await gameService.rollDice(game._id.toString(), 'B'); } catch (err) {}
      }, 3000 + Math.random() * 4000);
    }

    return game;
  }

  private processQueue() {}
  leaveQueue(userId: string, clubId: number) { this.queue.delete(clubId); }
}

export const matchmakingService = new MatchmakingService();

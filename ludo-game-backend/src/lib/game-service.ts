import { Game } from '@/models/Game';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { botService } from './bot-service';
import { emitGameUpdate } from './websocket';
import { getBotDiceRoll, shouldBotWin } from './bot-difficulty';

export class GameService {
  async rollDice(gameId: string, player: 'A' | 'B') {
    const game = await Game.findById(gameId);
    if (!game || game.status !== 'playing') throw new Error('Game not found');
    if (game.currentTurn !== player) throw new Error(`Not your turn`);

    let roll: number;
    const isBotGame = !game.playerBId;
    const botPlayer = !game.playerBId ? 'B' : !game.playerAId ? 'A' : null;
    const humanId = (botPlayer === 'B' ? game.playerAId : game.playerBId) || '0';

    if (isBotGame && player === botPlayer) {
      const humanRolls = botPlayer === 'B' ? game.playerARolls : game.playerBRolls;
      const botRolls = botPlayer === 'B' ? game.playerBRolls : game.playerARolls;
      const humanTotal = humanRolls.reduce((a: number, b: number) => a + b, 0);
      const botTotal = botRolls.reduce((a: number, b: number) => a + b, 0);
      const botWantsToWin = await shouldBotWin(humanId);
      roll = getBotDiceRoll(humanTotal, botTotal, botRolls.length === 2, botWantsToWin);
    } else {
      roll = Math.floor(Math.random() * 6) + 1;
    }

    if (player === 'A') { game.playerARolls.push(roll); game.playerATotal += roll; }
    else { game.playerBRolls.push(roll); game.playerBTotal += roll; }
    game.currentTurn = player === 'A' ? 'B' : 'A';
    await game.save();

    const numericGameId = Number(gameId);
    emitGameUpdate(numericGameId, { gameId, player, playerARolls: game.playerARolls, playerBRolls: game.playerBRolls, playerATotal: game.playerATotal, playerBTotal: game.playerBTotal, currentTurn: game.currentTurn, status: game.status, roll });

    if (game.playerARolls.length === 3 && game.playerBRolls.length === 3) {
      await this.completeGame(game);
      return await Game.findById(gameId);
    }

    if (isBotGame && botPlayer && game.currentTurn === botPlayer) {
      const botRolls = botPlayer === 'B' ? game.playerBRolls : game.playerARolls;
      if (botRolls.length < 3) {
        const delay = 3000 + Math.random() * 4000;
        const self = this;
        setTimeout(() => { self.rollDice(gameId, botPlayer).catch(err => console.error('Bot roll failed:', err)); }, delay);
      }
    }

    return game;
  }

  private async completeGame(game: any) {
    let winnerId: string | null = null;
    let winnerName: string;
    if (game.playerATotal > game.playerBTotal) { winnerId = game.playerAId; winnerName = game.playerAName; }
    else if (game.playerBTotal > game.playerATotal) { winnerId = game.playerBId; winnerName = game.playerBName; }
    else { winnerName = 'Draw'; }
    if (winnerName !== 'Draw' && !winnerId) winnerId = 'bot';

    game.winnerId = winnerId;
    game.status = 'completed';
    game.completedAt = new Date();
    await game.save();

    if (winnerId && winnerId !== 'bot') {
      await User.findByIdAndUpdate(winnerId, { $inc: { balance: game.betAmount * 2 } });
      await Transaction.create({ userId: winnerId, gameId: game._id, amount: game.betAmount * 2, type: 'win', description: `Won against ${winnerId === game.playerAId ? game.playerBName : game.playerAName}` });
    }
    if (!game.playerBId) botService.releaseBot(game.playerBName);
    if (!game.playerAId) botService.releaseBot(game.playerAName);
  }
}

export const gameService = new GameService();

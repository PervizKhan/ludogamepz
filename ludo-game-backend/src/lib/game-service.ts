import db from './db';
import { botService } from './bot-service';
import { Game } from '@/types';
import { parseRolls } from './json-utils';
import { emitGameUpdate } from './websocket';
import { getBotDiceRoll } from './bot-difficulty';

const PLATFORM_FEE = 0;

export class GameService {
  async rollDice(gameId: number, player: 'A' | 'B'): Promise<Game> {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as Game;
    if (!game || game.status !== 'playing') throw new Error('Game not found');
    if (game.current_turn && game.current_turn !== player) throw new Error('Not your turn');

    let roll: number;
    const isBotGame = game.player_b_id === null || game.player_a_id === null;
    const botPlayer = game.player_b_id === null ? 'B' : game.player_a_id === null ? 'A' : null;
    const humanId = (botPlayer === 'B' ? game.player_a_id : game.player_b_id) || 0;

    if (isBotGame && player === botPlayer) {
      const aRolls = parseRolls(game.player_a_rolls);
      const bRolls = parseRolls(game.player_b_rolls);
      const humanRolls = botPlayer === 'B' ? aRolls : bRolls;
      const botRolls = botPlayer === 'B' ? bRolls : aRolls;
      roll = getBotDiceRoll(humanId, humanRolls.reduce((s: number, r: number) => s + r, 0), botRolls.reduce((s: number, r: number) => s + r, 0), botRolls.length === 2);
    } else {
      roll = Math.floor(Math.random() * 6) + 1;
    }

    const rollsField = player === 'A' ? 'player_a_rolls' : 'player_b_rolls';
    const totalField = player === 'A' ? 'player_a_total' : 'player_b_total';
    const rawRolls = rollsField === 'player_a_rolls' ? game.player_a_rolls : game.player_b_rolls;
    const currentRolls = parseRolls(rawRolls);
    currentRolls.push(roll);
    const newTotal = currentRolls.reduce((s: number, r: number) => s + r, 0);
    const nextTurn = player === 'A' ? 'B' : 'A';

    db.prepare(`UPDATE games SET ${rollsField} = ?, ${totalField} = ?, current_turn = ? WHERE id = ?`)
      .run(JSON.stringify(currentRolls), newTotal, nextTurn, gameId);

    const updatedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as Game;
    updatedGame.player_a_rolls = parseRolls(updatedGame.player_a_rolls);
    updatedGame.player_b_rolls = parseRolls(updatedGame.player_b_rolls);

    const aRolls = updatedGame.player_a_rolls;
    const bRolls = updatedGame.player_b_rolls;

    emitGameUpdate(gameId, { gameId, player, playerARolls: aRolls, playerBRolls: bRolls, playerATotal: updatedGame.player_a_total, playerBTotal: updatedGame.player_b_total, currentTurn: nextTurn, status: updatedGame.status, roll });

    if (aRolls.length === 3 && bRolls.length === 3) {
      this.completeGame(updatedGame);
      const finalGame = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as Game;
      emitGameUpdate(gameId, { gameId, status: 'completed', winner: finalGame.winner_id, playerATotal: finalGame.player_a_total, playerBTotal: finalGame.player_b_total });
      return finalGame;
    }

    if (isBotGame && botPlayer && nextTurn === botPlayer) {
      const botRolls = botPlayer === 'B' ? bRolls : aRolls;
      if (botRolls.length < 3) {
        const delay = 3000 + Math.random() * 4000;
        const self = this;
        setTimeout(() => { self.rollDice(gameId, botPlayer).catch(err => console.error('Bot roll failed:', err)); }, delay);
      }
    }

    return updatedGame;
  }

  private completeGame(game: Game) {
    let winnerId: number | null = null;
    let winnerName: string;

    if (game.player_a_total > game.player_b_total) {
      winnerId = game.player_a_id ?? null;
      winnerName = game.player_a_name;
    } else if (game.player_b_total > game.player_a_total) {
      winnerId = game.player_b_id ?? null;
      winnerName = game.player_b_name;
    } else {
      winnerName = 'Draw';
    }

    // If bot wins, set winner_id to 0 (House) so admin can see it
    if (winnerName !== 'Draw' && (winnerId === null || winnerId === 0)) {
      winnerId = 0;
    }

    db.prepare(`UPDATE games SET winner_id = ?, status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(winnerId, game.id);

    const betAmount = game.bet_amount;
    const totalPot = betAmount * 2;
    const platformFee = Math.floor(totalPot * PLATFORM_FEE);
    const winnerGets = totalPot - platformFee;

    if (winnerId && winnerId > 0) {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(winnerGets, winnerId);
      db.prepare('INSERT INTO transactions (user_id, game_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
        .run(winnerId, game.id, winnerGets, 'win', `Won against ${winnerId === game.player_a_id ? game.player_b_name : game.player_a_name} (10% fee: ₹${platformFee})`);
      db.prepare('INSERT INTO transactions (user_id, game_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
        .run(winnerId, game.id, -platformFee, 'fee', `Platform fee (10%)`);
      const loserId = winnerId === game.player_a_id ? game.player_b_id : game.player_a_id;
      if (loserId && loserId > 0) {
        db.prepare('INSERT INTO transactions (user_id, game_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
          .run(loserId, game.id, -betAmount, 'loss', `Lost to ${winnerName}`);
      }
    } else if (winnerId === 0) {
      // Bot won - human lost their bet already, add fee to house
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(platformFee, 0);
      const humanId = game.player_a_id || game.player_b_id;
      if (humanId && humanId > 0) {
        db.prepare('INSERT INTO transactions (user_id, game_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
          .run(humanId, game.id, -betAmount, 'loss', `Lost to ${winnerName}`);
      }
    } else {
      // Draw
      if (game.player_a_id && game.player_a_id > 0) {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(betAmount, game.player_a_id);
      }
      if (game.player_b_id && game.player_b_id > 0) {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(betAmount, game.player_b_id);
      }
    }

    if (game.player_b_id === null) botService.releaseBot(game.player_b_name);
    if (game.player_a_id === null) botService.releaseBot(game.player_a_name);
  }

  getGame(gameId: number): Game | null {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as Game;
    if (game) {
      game.player_a_rolls = parseRolls(game.player_a_rolls);
      game.player_b_rolls = parseRolls(game.player_b_rolls);
    }
    return game || null;
  }
}

export const gameService = new GameService();

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface Game1v1 {
  id: string;
  creatorId: number;
  creatorName: string;
  joinerId: number | null;
  joinerName: string | null;
  bet: number;
  agreedBet: number | null;
  pot: number;
  creatorRolls: number[];
  joinerRolls: number[];
  rollsPerPlayer: number;
  currentTurn: number; // 1-6 (3 per player)
  turn: 'creator' | 'joiner';
  turnStartedAt: number | null;
  status: 'waiting' | 'negotiating' | 'playing' | 'finished';
  winner: number | null;
  betProposer: 'creator' | 'joiner' | null;
}

const games = new Map<string, Game1v1>();
const playerGame = new Map<number, string>();
const TURN_TIMEOUT = 10000;
const ROLLS_PER_PLAYER = 3; // Each player rolls 3 times = 6 total turns

function determineTurn(turnNumber: number): 'creator' | 'joiner' {
  // Turn 1,3,5 = creator, Turn 2,4,6 = joiner (alternating)
  return turnNumber % 2 === 1 ? 'creator' : 'joiner';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const playerId = searchParams.get('playerId');

  const db = getDb();

  if (action === 'list') {
    const available = Array.from(games.values())
      .filter(g => g.status === 'waiting')
      .map(g => ({
        id: g.id,
        creatorName: g.creatorName,
        bet: g.bet
      }));
    return NextResponse.json({ success: true, games: available });
  }

  if (action === 'state' && playerId) {
    const pid = parseInt(playerId);
    const gameId = playerGame.get(pid);
    const player = db.prepare('SELECT balance FROM players WHERE id = ?').get(pid) as any;

    if (!gameId || !games.has(gameId)) {
      return NextResponse.json({ 
        success: true, 
        playerBalance: player?.balance || 0,
        game: null 
      });
    }

    const game = games.get(gameId)!;
    const isCreator = pid === game.creatorId;
    
    // Check turn timeout
    if (game.status === 'playing' && game.turnStartedAt) {
      const elapsed = Date.now() - game.turnStartedAt;
      if (elapsed > TURN_TIMEOUT) {
        // Auto-forfeit - give 0 for this roll and move to next turn
        if (game.turn === 'creator') {
          game.creatorRolls.push(0);
        } else {
          game.joinerRolls.push(0);
        }
        game.currentTurn++;
        
        if (game.currentTurn > game.rollsPerPlayer * 2) {
          finishGame(game, db);
        } else {
          game.turn = determineTurn(game.currentTurn);
          game.turnStartedAt = Date.now();
        }
      }
    }

    const myRolls = isCreator ? game.creatorRolls : game.joinerRolls;
    const oppRolls = isCreator ? game.joinerRolls : game.creatorRolls;
    const myTotal = myRolls.reduce((a, b) => a + b, 0);
    const oppTotal = oppRolls.reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      playerBalance: player?.balance || 0,
      game: {
        id: game.id,
        status: game.status,
        pot: game.pot,
        bet: game.bet,
        agreedBet: game.agreedBet,
        currentTurn: game.currentTurn,
        totalTurns: game.rollsPerPlayer * 2,
        myRolls: myRolls,
        oppRolls: oppRolls,
        myTotal: myTotal,
        oppTotal: oppTotal,
        turn: game.turn,
        turnStartedAt: game.turnStartedAt,
        player1: { id: game.creatorId, name: game.creatorName },
        player2: game.joinerId ? { id: game.joinerId, name: game.joinerName } : null,
        opponentName: isCreator ? game.joinerName : game.creatorName,
        winner: game.winner,
        isMyTurn: game.status === 'playing' && game.turn === (isCreator ? 'creator' : 'joiner'),
        betProposer: game.betProposer,
        rollsPerPlayer: game.rollsPerPlayer,
      }
    });
  }

  return NextResponse.json({ success: false }, { status: 400 });
}

function finishGame(game: Game1v1, db: any) {
  game.status = 'finished';
  
  const creatorTotal = game.creatorRolls.reduce((a, b) => a + b, 0);
  const joinerTotal = game.joinerRolls.reduce((a, b) => a + b, 0);
  
  if (creatorTotal > joinerTotal) {
    game.winner = game.creatorId;
  } else if (joinerTotal > creatorTotal) {
    game.winner = game.joinerId;
  } else {
    game.winner = 0; // tie
  }

  // Pay winner or refund on tie
  if (game.winner && game.winner !== 0) {
    db.prepare('UPDATE players SET balance = balance + ? WHERE id = ?').run(game.pot, game.winner);
  } else if (game.winner === 0) {
    // Tie - refund both
    db.prepare('UPDATE players SET balance = balance + ? WHERE id = ?').run(game.agreedBet!, game.creatorId);
    db.prepare('UPDATE players SET balance = balance + ? WHERE id = ?').run(game.agreedBet!, game.joinerId!);
  }
  
  // Cleanup after 30s
  const gameId = game.id;
  setTimeout(() => {
    games.delete(gameId);
    playerGame.delete(game.creatorId);
    if (game.joinerId) playerGame.delete(game.joinerId);
  }, 30000);
}

export async function POST(request: NextRequest) {
  const { playerId, action, amount, gameId } = await request.json();
  const db = getDb();
  const pid = parseInt(playerId);

  const player = db.prepare('SELECT id, name, balance FROM players WHERE id = ? AND is_admin = 0')
    .get(pid) as any;
  if (!player) {
    return NextResponse.json({ success: false, message: 'Player not found' }, { status: 403 });
  }

  // CREATE GAME
  if (action === 'create') {
    const existingGameId = playerGame.get(pid);
    if (existingGameId) games.delete(existingGameId);

    const betAmount = parseInt(amount) || 50;
    if (betAmount < 10 || betAmount > 500) {
      return NextResponse.json({ success: false, message: 'Bet must be Rs 10-500' }, { status: 400 });
    }

    const id = Date.now().toString();
    games.set(id, {
      id, creatorId: pid, creatorName: player.name,
      joinerId: null, joinerName: null,
      bet: betAmount, agreedBet: null, pot: 0,
      creatorRolls: [], joinerRolls: [],
      rollsPerPlayer: ROLLS_PER_PLAYER,
      currentTurn: 1,
      turn: 'creator',
      turnStartedAt: null,
      status: 'waiting', winner: null,
      betProposer: 'creator',
    });
    playerGame.set(pid, id);

    return NextResponse.json({ success: true, gameId: id });
  }

  // JOIN GAME
  if (action === 'join' && gameId) {
    const game = games.get(gameId);
    if (!game || game.status !== 'waiting') {
      return NextResponse.json({ success: false, message: 'Game not available' }, { status: 400 });
    }
    if (game.creatorId === pid) {
      return NextResponse.json({ success: false, message: 'Cannot join own game' }, { status: 400 });
    }

    game.joinerId = pid;
    game.joinerName = player.name;
    game.status = 'negotiating';
    playerGame.set(pid, gameId);

    return NextResponse.json({ success: true, message: 'Joined! Negotiate the bet.' });
  }

  const currentGameId = playerGame.get(pid);
  if (!currentGameId) {
    return NextResponse.json({ success: false, message: 'Not in a game' }, { status: 400 });
  }
  const game = games.get(currentGameId)!;

  // ACCEPT BET
  if (action === 'accept') {
    if (game.status !== 'negotiating') {
      return NextResponse.json({ success: false, message: 'Not in negotiation' }, { status: 400 });
    }

    const finalBet = game.bet;
    if (finalBet > player.balance) {
      return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 400 });
    }

    const otherId = pid === game.creatorId ? game.joinerId : game.creatorId;
    const otherPlayer = db.prepare('SELECT balance FROM players WHERE id = ?').get(otherId) as any;
    if (!otherPlayer || finalBet > otherPlayer.balance) {
      return NextResponse.json({ success: false, message: 'Opponent has insufficient balance' }, { status: 400 });
    }

    game.agreedBet = finalBet;
    game.pot = finalBet * 2;
    game.status = 'playing';
    
    // Creator always goes first (Turn 1)
    game.currentTurn = 1;
    game.turn = 'creator';
    game.turnStartedAt = Date.now();

    // Deduct bets
    db.prepare('UPDATE players SET balance = balance - ? WHERE id = ?').run(finalBet, game.creatorId);
    db.prepare('UPDATE players SET balance = balance - ? WHERE id = ?').run(finalBet, game.joinerId!);

    return NextResponse.json({ success: true, message: `Game starts! ${game.creatorName} rolls first. ${ROLLS_PER_PLAYER} rolls each.` });
  }

  // COUNTER BET
  if (action === 'counter') {
    if (game.status !== 'negotiating') {
      return NextResponse.json({ success: false, message: 'Not in negotiation' }, { status: 400 });
    }

    const newBet = parseInt(amount);
    if (!newBet || newBet < 10 || newBet > 500) {
      return NextResponse.json({ success: false, message: 'Bet must be Rs 10-500' }, { status: 400 });
    }

    game.bet = newBet;
    game.betProposer = pid === game.creatorId ? 'creator' : 'joiner';

    return NextResponse.json({ success: true, message: `Counter offer: Rs ${newBet}` });
  }

  // ROLL DICE
  if (action === 'roll') {
    if (game.status !== 'playing') {
      return NextResponse.json({ success: false, message: 'Game not active' }, { status: 400 });
    }

    const isCreator = pid === game.creatorId;
    const myTurn = game.turn === (isCreator ? 'creator' : 'joiner');

    if (!myTurn) {
      return NextResponse.json({ success: false, message: 'Not your turn' }, { status: 400 });
    }

    // Roll 1-6
    const roll = Math.floor(Math.random() * 6) + 1;

    if (isCreator) {
      game.creatorRolls.push(roll);
    } else {
      game.joinerRolls.push(roll);
    }

    game.currentTurn++;
    let message = `You rolled ${roll}! (Roll ${game.creatorRolls.length + game.joinerRolls.length}/${game.rollsPerPlayer * 2})`;

    // Check if game over
    if (game.currentTurn > game.rollsPerPlayer * 2) {
      finishGame(game, db);
      
      const myRolls = isCreator ? game.creatorRolls : game.joinerRolls;
      const oppRolls = isCreator ? game.joinerRolls : game.creatorRolls;
      const myTotal = myRolls.reduce((a, b) => a + b, 0);
      const oppTotal = oppRolls.reduce((a, b) => a + b, 0);
      
      if (game.winner === 0) {
        message = `Tie! Both scored ${myTotal}. Bets refunded.`;
      } else {
        message = game.winner === pid 
          ? `You WIN! ${myTotal} vs ${oppTotal}` 
          : `You lose. ${myTotal} vs ${oppTotal}`;
      }
    } else {
      // Next turn
      game.turn = determineTurn(game.currentTurn);
      game.turnStartedAt = Date.now();
      const nextPlayer = game.turn === 'creator' ? game.creatorName : game.joinerName;
      message = `You rolled ${roll}. ${nextPlayer}'s turn!`;
    }

    const updatedPlayer = db.prepare('SELECT balance FROM players WHERE id = ?').get(pid) as any;

    const myRolls = isCreator ? game.creatorRolls : game.joinerRolls;
    const oppRolls = isCreator ? game.joinerRolls : game.creatorRolls;
    const myTotal = myRolls.reduce((a, b) => a + b, 0);
    const oppTotal = oppRolls.reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      message,
      newBalance: updatedPlayer?.balance,
      yourRoll: roll,
      game: {
        status: game.status,
        pot: game.pot,
        currentTurn: game.currentTurn,
        totalTurns: game.rollsPerPlayer * 2,
        myRolls: myRolls,
        oppRolls: oppRolls,
        myTotal: myTotal,
        oppTotal: oppTotal,
        opponentName: isCreator ? game.joinerName : game.creatorName,
        winner: game.winner,
        isMyTurn: false,
        agreedBet: game.agreedBet,
        bet: game.bet,
        player1: { id: game.creatorId, name: game.creatorName },
        betProposer: game.betProposer,
        rollsPerPlayer: game.rollsPerPlayer,
      }
    });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { gameService } from './game-service';
import { matchmakingService } from './matchmaking-service';

let io: SocketServer;

export function initWebSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join game room
    socket.on('join-game', (gameId: number) => {
      socket.join(`game-${gameId}`);
      console.log(`Socket ${socket.id} joined game-${gameId}`);
    });

    // Leave game room
    socket.on('leave-game', (gameId: number) => {
      socket.leave(`game-${gameId}`);
    });

    // Player rolled dice
    socket.on('player-rolled', async ({ gameId, player, roll }) => {
      try {
        const game = await gameService.rollDice(gameId, player);

        // Broadcast to all players in the game
        io.to(`game-${gameId}`).emit('game-update', {
          gameId,
          player,
          roll,
          playerATotal: game.player_a_total,
          playerBTotal: game.player_b_total,
          playerARolls: game.player_a_rolls,
          playerBRolls: game.player_b_rolls,
          status: game.status,
          currentTurn: game.player_a_rolls.length <= game.player_b_rolls.length ? 'A' : 'B',
        });

        // If game completed, broadcast result
        if (game.status === 'completed') {
          io.to(`game-${gameId}`).emit('game-ended', {
            gameId,
            winner: game.winner_id,
            playerATotal: game.player_a_total,
            playerBTotal: game.player_b_total,
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Roll failed' });
      }
    });

    // Matchmaking events
    socket.on('join-matchmaking', ({ userId, clubId }) => {
      socket.join(`matchmaking-${clubId}`);
    });

    // Admin events
    socket.on('admin-subscribe', () => {
      socket.join('admin-room');
      socket.emit('admin-connected', { message: 'Connected to admin dashboard' });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

// Emit events from other services
export function emitGameUpdate(gameId: number, data: any) {
  if (io) {
    io.to(`game-${gameId}`).emit('game-update', data);
  }
}

export function emitMatchFound(gameId: number, players: any) {
  if (io) {
    io.to(`game-${gameId}`).emit('match-found', players);
  }
}

export function emitAdminStats(stats: any) {
  if (io) {
    io.to('admin-room').emit('admin-stats', stats);
  }
}

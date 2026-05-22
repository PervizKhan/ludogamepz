import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer;

export function initWebSocket(server: HttpServer) {
  io = new SocketServer(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-game', (gameId: number) => { socket.join(`game-${gameId}`); });
    socket.on('leave-game', (gameId: number) => { socket.leave(`game-${gameId}`); });
    socket.on('join-matchmaking', ({ userId, clubId }) => { socket.join(`matchmaking-${clubId}`); });
    socket.on('admin-subscribe', () => { socket.join('admin-room'); });

    socket.on('player-rolled', async ({ gameId, player, roll }) => {
      io.to(`game-${gameId}`).emit('game-update', { gameId, player, roll });
    });

    socket.on('disconnect', () => { console.log('Client disconnected:', socket.id); });
  });

  return io;
}

export function getIO() { if (!io) throw new Error('Socket.io not initialized'); return io; }

export function emitGameUpdate(gameId: number, data: any) {
  if (io) io.to(`game-${gameId}`).emit('game-update', data);
}

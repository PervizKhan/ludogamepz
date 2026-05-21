import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';

// Android emulator uses 10.0.2.2, iOS simulator uses localhost, web uses localhost
const API_BASE = Platform.select({
  android: 'http://192.168.59.156:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

const WS_URL = Platform.select({
  android: 'http://192.168.59.156:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

class WebSocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private pendingJoins: number[] = [];

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('Socket.io connected:', this.socket?.id);
      this.pendingJoins.forEach(gameId => {
        this.socket?.emit('join-game', gameId);
        console.log('Joined pending game:', gameId);
      });
      this.pendingJoins = [];
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.log('Socket.io error:', error.message);
    });

    this.socket.onAny((event: string, ...args: any[]) => {
      const listeners = this.listeners.get(event) || [];
      listeners.forEach(cb => cb(...args));
    });
  }

  on(event: string, callback: Function) {
    const listeners = this.listeners.get(event) || [];
    listeners.push(callback);
    this.listeners.set(event, listeners);
  }

  off(event: string, callback: Function) {
    const listeners = this.listeners.get(event) || [];
    this.listeners.set(event, listeners.filter(cb => cb !== callback));
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  joinGame(gameId: number) {
    if (this.socket?.connected) {
      this.socket.emit('join-game', gameId);
      console.log('Joined game room:', gameId);
    } else {
      this.pendingJoins.push(gameId);
      console.log('Queued game join:', gameId);
    }
  }

  leaveGame(gameId: number) {
    if (this.socket?.connected) {
      this.socket.emit('leave-game', gameId);
    }
    this.pendingJoins = this.pendingJoins.filter(id => id !== gameId);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const wsManager = new WebSocketManager();

export const api = {
  async getClubs() {
    const res = await fetch(`${API_BASE}/clubs`);
    return res.json();
  },

  async joinMatchmaking(userId: number, username: string, clubId: number, betAmount: number) {
    const res = await fetch(`${API_BASE}/matchmaking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username, clubId, betAmount }),
    });
    return res.json();
  },

  async rollDice(gameId: number, player: 'A' | 'B') {
    const res = await fetch(`${API_BASE}/game/roll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, player }),
    });
    return res.json();
  },

  async getGameStatus(gameId: number) {
    const res = await fetch(`${API_BASE}/game/status?gameId=${gameId}`);
    return res.json();
  },

  async getWallet(userId: number) {
    const res = await fetch(`${API_BASE}/wallet/balance?userId=${userId}`);
    return res.json();
  },

  async createUser(username: string, phone: string, initialBalance: number = 0) {
    const res = await fetch(`${API_BASE}/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, phone, initialBalance }),
    });
    return res.json();
  },

  async getLeaderboard(type: string = 'daily') {
    const res = await fetch(`${API_BASE}/leaderboard?type=${type}`);
    return res.json();
  },

  async getPlayerStats(userId: number) {
    const res = await fetch(`${API_BASE}/player/stats?userId=${userId}`);
    return res.json();
  },
};

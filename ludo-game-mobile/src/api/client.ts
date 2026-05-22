import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';

const API_BASE = Platform.select({
  android: 'https://ludogamepz.vercel.app/api',
  ios: 'https://ludogamepz.vercel.app/api',
  default: 'https://ludogamepz.vercel.app/api',
});

const WS_URL = Platform.select({
  android: 'https://ludogamepz.vercel.app',
  ios: 'https://ludogamepz.vercel.app',
  default: 'https://ludogamepz.vercel.app',
});

class WebSocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private pendingJoins: number[] = [];

  connect() {
    if (this.socket?.connected) return;
    this.socket = io(WS_URL, { transports: ['websocket', 'polling'], autoConnect: true, reconnection: true, reconnectionDelay: 3000, reconnectionAttempts: Infinity });
    this.socket.on('connect', () => {
      this.pendingJoins.forEach(gameId => { this.socket?.emit('join-game', gameId); });
      this.pendingJoins = [];
    });
    this.socket.on('disconnect', () => {});
    this.socket.on('connect_error', () => {});
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

  emit(event: string, data: any) { if (this.socket?.connected) this.socket.emit(event, data); }
  joinGame(gameId: number) { if (this.socket?.connected) this.socket.emit('join-game', gameId); else this.pendingJoins.push(gameId); }
  leaveGame(gameId: number) { if (this.socket?.connected) this.socket.emit('leave-game', gameId); }
  disconnect() { this.socket?.disconnect(); }
}

export const wsManager = new WebSocketManager();

export const api = {
  async getClubs() { const r = await fetch(`${API_BASE}/clubs`); return r.json(); },
  async joinMatchmaking(userId: number, username: string, clubId: number, betAmount: number) {
    const r = await fetch(`${API_BASE}/matchmaking`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, username, clubId, betAmount }) });
    return r.json();
  },
  async rollDice(gameId: number, player: 'A' | 'B') {
    const r = await fetch(`${API_BASE}/game/roll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameId, player }) });
    return r.json();
  },
  async getGameStatus(gameId: number) { const r = await fetch(`${API_BASE}/game/status?gameId=${gameId}`); return r.json(); },
  async getWallet(userId: number) { const r = await fetch(`${API_BASE}/wallet/balance?userId=${userId}`); return r.json(); },
  async createUser(username: string, phone: string, initialBalance: number = 0) {
    const r = await fetch(`${API_BASE}/wallet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, phone, initialBalance }) });
    return r.json();
  },
  async getLeaderboard(type: string = 'daily') { const r = await fetch(`${API_BASE}/leaderboard?type=${type}`); return r.json(); },
  async getPlayerStats(userId: number) { const r = await fetch(`${API_BASE}/player/stats?userId=${userId}`); return r.json(); },
};

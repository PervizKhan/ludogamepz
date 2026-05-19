import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.join(process.cwd(), 'diceduel.db'));
    db.pragma('journal_mode = WAL');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  const db = getDb();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      balance INTEGER DEFAULT 10000,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      transaction_id TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      game TEXT,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id)
    );
  `);

  // Seed admin if not exists
  const admin = db.prepare('SELECT id FROM players WHERE is_admin = 1').get();
  if (!admin) {
    db.prepare('INSERT INTO players (name, pin, balance, is_admin) VALUES (?, ?, ?, ?)')
      .run('Admin', '0000', 0, 1);
  }

  // Seed demo players with 10,000 balance for testing
  const count = db.prepare('SELECT COUNT(*) as count FROM players WHERE is_admin = 0').get() as any;
  if (count.count === 0) {
    const demoPlayers = ['Ali', 'Sara', 'Bilal', 'Ayesha'];
    const insertPlayer = db.prepare('INSERT OR IGNORE INTO players (name, pin, balance) VALUES (?, ?, ?)');
    demoPlayers.forEach(name => insertPlayer.run(name, '1234', 10000));
  }
}

// Online players tracking (in-memory)
const onlinePlayers = new Map<number, { lastSeen: number; name: string }>();

// Clean up inactive players every 10 seconds
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of onlinePlayers) {
    if (now - data.lastSeen > 30000) {
      onlinePlayers.delete(id);
    }
  }
}, 10000);

export function getOnlinePlayers(): Map<number, { lastSeen: number; name: string }> {
  return onlinePlayers;
}

export function markPlayerOnline(playerId: number, name: string): void {
  onlinePlayers.set(playerId, { lastSeen: Date.now(), name });
}

// Game state management
interface GameState {
  pot: number;
  players: GamePlayer[];
  rolled: boolean;
  result: string | null;
  roundId: string;
  gameType: string;
}

interface GamePlayer {
  id: number;
  name: string;
  bet: number;
  roll: number | null;
}

let currentGame: GameState = {
  pot: 0,
  players: [],
  rolled: false,
  result: null,
  roundId: '',
  gameType: 'dice'
};

export function getGameState(): GameState {
  return currentGame;
}

export function setGameState(state: GameState): void {
  currentGame = state;
}
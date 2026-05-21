import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'ludo.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    phone TEXT UNIQUE,
    balance REAL DEFAULT 500,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

try { db.exec(`ALTER TABLE users ADD COLUMN email TEXT`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN password TEXT`); } catch (e) {}

db.prepare('INSERT OR IGNORE INTO users (id, username, balance) VALUES (?, ?, ?)').run(0, 'House', 0);

db.exec(`
  CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    bet_amount REAL NOT NULL,
    online_players INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    player_a_id INTEGER,
    player_b_id INTEGER,
    player_a_name TEXT,
    player_b_name TEXT,
    player_a_rolls TEXT,
    player_b_rolls TEXT,
    player_a_total INTEGER DEFAULT 0,
    player_b_total INTEGER DEFAULT 0,
    current_turn TEXT DEFAULT 'A',
    winner_id INTEGER,
    bet_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (club_id) REFERENCES clubs(id)
  )
`);

try { db.exec(`ALTER TABLE games ADD COLUMN current_turn TEXT DEFAULT 'A'`); } catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_id INTEGER,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  INSERT OR IGNORE INTO clubs (name, code, bet_amount, online_players) VALUES
  ('Mumbai Club', 'mumbai', 100, 156),
  ('Karachi Club', 'karachi', 250, 323),
  ('Delhi Club', 'delhi', 500, 89),
  ('Lahore Club', 'lahore', 1000, 45),
  ('Bangalore Club', 'bangalore', 50, 234),
  ('Dubai Club', 'dubai', 2000, 12)
`);

export default db;
export function getDb() { return db; }

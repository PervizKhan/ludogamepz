import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOnlinePlayers, markPlayerOnline } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const pin = searchParams.get('pin');
  const action = searchParams.get('action');
  const playerId = searchParams.get('playerId');

  const db = getDb();

  // Heartbeat - mark player as online
  if (action === 'heartbeat' && playerId) {
    const player = db.prepare('SELECT id, name FROM players WHERE id = ?').get(parseInt(playerId)) as any;
    if (player) {
      markPlayerOnline(player.id, player.name);
    }
    const online = getOnlinePlayers();
    return NextResponse.json({ success: true, online: online.size });
  }

  // Get online players list
  if (action === 'online') {
    const online = getOnlinePlayers();
    const onlineNames = Array.from(online.values()).map(p => p.name);
    // For testing: always show all 4 demo players
    const fakeOnline = ['Ali', 'Sara', 'Bilal', 'Ayesha'];
    return NextResponse.json({ 
      success: true, 
      online: [...new Set([...onlineNames, ...fakeOnline])],
      count: online.size 
    });
  }

  // Login
  if (name && pin) {
    const player = db.prepare('SELECT id, name, balance, is_admin FROM players WHERE name = ? AND pin = ?')
      .get(name, pin) as any;
    
    if (player) {
      markPlayerOnline(player.id, player.name);
      
      return NextResponse.json({ 
        success: true, 
        player: {
          id: player.id,
          name: player.name,
          balance: player.balance,
          isAdmin: !!player.is_admin
        }
      });
    }
    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }

  // Get all players
  const players = db.prepare('SELECT id, name, balance FROM players WHERE is_admin = 0').all();
  return NextResponse.json({ success: true, players });
}

export async function POST(request: NextRequest) {
  const { name, pin } = await request.json();
  const db = getDb();

  const existing = db.prepare('SELECT id FROM players WHERE name = ?').get(name);
  if (existing) {
    return NextResponse.json({ success: false, message: 'Name already taken' }, { status: 400 });
  }

  const result = db.prepare('INSERT INTO players (name, pin, balance) VALUES (?, ?, ?)')
    .run(name, pin, 10000);
  
  const player = db.prepare('SELECT id, name, balance, is_admin FROM players WHERE id = ?')
    .get(result.lastInsertRowid) as any;

  markPlayerOnline(player.id, player.name);

  return NextResponse.json({ 
    success: true, 
    player: {
      id: player.id,
      name: player.name,
      balance: player.balance,
      isAdmin: false
    }
  });
}
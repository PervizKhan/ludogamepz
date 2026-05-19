import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const MIN_DEPOSIT = 50;
const MAX_DEPOSIT = 5000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');

  if (!playerId) {
    return NextResponse.json({ success: false, message: 'Player ID required' }, { status: 400 });
  }

  const db = getDb();
  const deposits = db.prepare(
    'SELECT * FROM deposits WHERE player_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(playerId);

  return NextResponse.json({ success: true, deposits });
}

export async function POST(request: NextRequest) {
  const { playerId, amount, transactionId } = await request.json();
  const db = getDb();

  // Validation
  if (!playerId || !amount || !transactionId) {
    return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
  }

  const depositAmount = parseInt(amount);
  if (isNaN(depositAmount) || depositAmount < MIN_DEPOSIT || depositAmount > MAX_DEPOSIT) {
    return NextResponse.json({ 
      success: false, 
      message: `Amount must be between Rs ${MIN_DEPOSIT} and Rs ${MAX_DEPOSIT}` 
    }, { status: 400 });
  }

  // Check player exists
  const player = db.prepare('SELECT id FROM players WHERE id = ? AND is_admin = 0').get(playerId);
  if (!player) {
    return NextResponse.json({ success: false, message: 'Invalid player' }, { status: 403 });
  }

  // Check duplicate transaction
  const existing = db.prepare('SELECT id FROM deposits WHERE transaction_id = ?').get(transactionId);
  if (existing) {
    return NextResponse.json({ success: false, message: 'Transaction ID already used' }, { status: 400 });
  }

  // Rate limiting
  const recentDeposits = db.prepare(
    "SELECT COUNT(*) as count FROM deposits WHERE player_id = ? AND created_at > datetime('now', '-5 minutes')"
  ).get(playerId) as any;

  if (recentDeposits.count > 3) {
    return NextResponse.json({ 
      success: false, 
      message: 'Too many attempts. Wait 5 minutes.' 
    }, { status: 429 });
  }

  db.prepare('INSERT INTO deposits (player_id, amount, transaction_id) VALUES (?, ?, ?)')
    .run(playerId, depositAmount, transactionId);

  return NextResponse.json({ success: true, message: 'Deposit submitted for verification' });
}
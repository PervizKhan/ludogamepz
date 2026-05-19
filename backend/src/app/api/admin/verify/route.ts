import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adminPin = searchParams.get('pin');

  if (adminPin !== '0000') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const deposits = db.prepare(`
    SELECT d.*, p.name as player_name 
    FROM deposits d 
    JOIN players p ON d.player_id = p.id 
    WHERE d.status = 'pending' 
    ORDER BY d.created_at DESC
  `).all();

  return NextResponse.json({ success: true, deposits });
}

export async function POST(request: NextRequest) {
  const { depositId, action, adminPin } = await request.json();

  if (adminPin !== '0000') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const deposit = db.prepare('SELECT * FROM deposits WHERE id = ? AND status = ?').get(depositId, 'pending') as any;

  if (!deposit) {
    return NextResponse.json({ 
      success: false, 
      message: 'Deposit not found or already processed' 
    }, { status: 400 });
  }

  if (action === 'approve') {
    const transaction = db.transaction(() => {
      db.prepare('UPDATE deposits SET status = ? WHERE id = ?').run('approved', depositId);
      db.prepare('UPDATE players SET balance = balance + ? WHERE id = ?').run(deposit.amount, deposit.player_id);
      
      // Log transaction
      db.prepare('INSERT INTO transactions (player_id, type, amount) VALUES (?, ?, ?)')
        .run(deposit.player_id, 'deposit', deposit.amount);
    });
    transaction();
  } else if (action === 'reject') {
    db.prepare('UPDATE deposits SET status = ? WHERE id = ?').run('rejected', depositId);
  }

  return NextResponse.json({ success: true });
}
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });

  const db = getDb();
  const user = db.prepare('SELECT id, username, email, balance FROM users WHERE id = ?').get(userId) as any;
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId);
  return NextResponse.json({ success: true, user, transactions });
}

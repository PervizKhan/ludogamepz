import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ success: false, message: 'Username and password required' }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare('SELECT id, username, email, balance FROM users WHERE username = ? AND password = ?')
    .get(username.trim(), password) as any;

  if (!user) {
    return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 });
  }

  return NextResponse.json({ success: true, user });
}

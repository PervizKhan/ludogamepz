import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyOTP } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  const { email, otp, username, password } = await request.json();

  if (!email || !otp || !username || !password) {
    return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });
  }

  const valid = verifyOTP(email, otp);
  if (!valid) {
    return NextResponse.json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
  }

  const db = getDb();
  
  const result = db.prepare('INSERT INTO users (username, email, password, balance) VALUES (?, ?, ?, ?)')
    .run(username.trim(), email.trim(), password, 500);

  const user = db.prepare('SELECT id, username, email, balance FROM users WHERE id = ?')
    .get(result.lastInsertRowid);

  return NextResponse.json({ success: true, user });
}
